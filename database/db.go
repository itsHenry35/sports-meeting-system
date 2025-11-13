package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/SHXZ-OSS/sports-meeting-system/config"
	"github.com/SHXZ-OSS/sports-meeting-system/types"
	"github.com/SHXZ-OSS/sports-meeting-system/utils"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

// Initialize 初始化数据库连接
func Initialize() error {
	// 确保数据库目录存在
	dbPath := config.Get().Database.Path
	dbDir := filepath.Dir(dbPath)
	if err := os.MkdirAll(dbDir, 0755); err != nil {
		return fmt.Errorf("failed to create database directory: %v", err)
	}

	// 检查数据库文件是否存在，用于判断是否为首次运行
	isFirstRun := !fileExists(dbPath)

	// 打开数据库连接
	var err error
	db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent), // 设置日志级别
	})
	if err != nil {
		return fmt.Errorf("failed to open database: %v", err)
	}

	// 获取底层sql.DB以设置连接池参数
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get underlying sql.DB: %v", err)
	}

	// 设置连接池参数 - SQLite 在 WAL 模式下同时只能有一个写入者
	// 将最大打开连接数设置为 1，避免并发写入冲突
	sqlDB.SetMaxOpenConns(1)
	sqlDB.SetMaxIdleConns(1)

	// 测试连接
	if err = sqlDB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	// 设置 WAL 模式和其他PRAGMA
	if err = db.Exec("PRAGMA journal_mode=WAL;").Error; err != nil {
		log.Fatalf("设置 WAL 模式失败: %v", err)
	}

	// 设置 busy_timeout (单位：毫秒)
	if err = db.Exec("PRAGMA busy_timeout=10000;").Error; err != nil {
		log.Fatalf("设置 busy_timeout 失败: %v", err)
	}

	// 启用同步模式为 NORMAL，在 WAL 模式下提供更好的性能
	if err = db.Exec("PRAGMA synchronous=NORMAL;").Error; err != nil {
		log.Fatalf("设置 synchronous 失败: %v", err)
	}

	// 自动迁移数据库表
	if err = autoMigrate(); err != nil {
		return fmt.Errorf("failed to migrate tables: %v", err)
	}

	// 如果是首次运行，创建管理员账户
	if isFirstRun {
		if err := setupInitialSystem(); err != nil {
			return fmt.Errorf("failed to setup initial system: %v", err)
		}
	}

	return nil
}

// setupInitialSystem 首次运行时的系统设置
func setupInitialSystem() error {
	// 生成随机管理员密码
	adminPassword, err := utils.GenerateRandomPassword(12)
	if err != nil {
		return fmt.Errorf("failed to generate admin password: %v", err)
	}

	// 生成JWT密钥
	jwtSecret, err := utils.GenerateSecureToken(32)
	if err != nil {
		return fmt.Errorf("failed to generate JWT secret: %v", err)
	}

	// 更新config中的密钥
	cfg := config.Get()
	cfg.Security.JWTSecret = jwtSecret

	// 对密码进行哈希处理
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(adminPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash admin password: %v", err)
	}

	// 插入管理员用户
	adminUser := types.User{
		Username:    "admin",
		Password:    string(hashedPassword),
		FullName:    "系统管理员",
		Permission:  utils.GetAllPermissions(),
		DingTalkID:  "0",
		ClassScopes: []types.Class{},
	}

	err = db.Create(&adminUser).Error
	if err != nil {
		return fmt.Errorf("failed to insert admin user: %v", err)
	}

	// 创建第一个运动会届次
	defaultEvent := types.Event{
		Name: "运动会",
	}
	err = db.Create(&defaultEvent).Error
	if err != nil {
		return fmt.Errorf("failed to create default event: %v", err)
	}

	// 更新配置中的当前Event ID
	cfg.CurrentEventID = defaultEvent.ID

	// 保存配置
	if err := config.Save(); err != nil {
		return fmt.Errorf("failed to save config: %v", err)
	}

	// 在控制台打印管理员密码
	log.Println("========================================================")
	log.Println("  首次启动系统，已创建管理员账户:")
	log.Println("  用户名: admin")
	log.Printf("  密码: %s", adminPassword)
	log.Println("  请妥善保管此密码，首次登录后请立即修改密码！")
	log.Println("========================================================")

	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return db
}

// Close 关闭数据库连接
func Close() error {
	if db != nil {
		sqlDB, err := db.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}

// autoMigrate 自动迁移数据库表
func autoMigrate() error {
	// 执行自动迁移
	err := db.AutoMigrate(
		&types.User{},
		&types.Class{},
		&types.Student{},
		&types.ParentStudentRelation{},
		&types.Event{},
		&types.Competition{},
		&types.Registration{},
		&types.Score{},
		&types.Vote{},
		&types.Points{},
	)
	if err != nil {
		return fmt.Errorf("failed to auto migrate: %v", err)
	}

	// 添加唯一索引
	if err := db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_student_relation ON parent_student_relations(parent_id, student_id, relation)").Error; err != nil {
		log.Printf("Warning: failed to create unique index for parent_student_relations: %v", err)
	}

	if err := db.Exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_registration ON registrations(student_id, competition_id)").Error; err != nil {
		log.Printf("Warning: failed to create unique index for registrations: %v", err)
	}

	return nil
}

// fileExists 检查文件是否存在
func fileExists(filePath string) bool {
	_, err := os.Stat(filePath)
	return !os.IsNotExist(err)
}
