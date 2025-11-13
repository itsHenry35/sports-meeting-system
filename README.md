# 上海市行知中学运动会系统

一个功能完善的运动会管理系统，支持项目征集、报名、成绩录入与审核、积分统计、公开看板等功能。系统采用前后端分离架构，后端使用 Go + Gin + GORM，前端使用 React + TypeScript + Ant Design。

Built For [上海市行知中学](https://school.bsedu.org.cn/xzhs/)

<img src="https://cdn.itshenryz.com/image-20251113233905953.png" alt="image-20251113233905953" style="zoom:25%;" />

## 功能特性

### 管理员功能

- **用户管理**：创建、编辑、删除用户账号，支持细粒度权限控制
  ![image-20251113234022015](https://cdn.itshenryz.com/image-20251113234022015.png)
  
- **学生与班级管理**：管理学生信息和班级信息，支持批量导入

- **项目管理**：管理比赛项目，审核学生提交的项目推荐
  ![image-20251113234055381](https://cdn.itshenryz.com/image-20251113234055381.png)
  
- **报名管理**：查看和管理学生报名情况，导出报名，随机抽选

  ![image-20251113234238512](https://cdn.itshenryz.com/image-20251113234238512.png)

- **成绩录入**：录入比赛成绩

- **成绩审核**：审核已提交的成绩

- **积分管理**：自动计算积分，支持自定义加分，查看班级和学生排名

  ![image-20251113234318018](https://cdn.itshenryz.com/image-20251113234318018.png)

- **系统设置**：配置网站信息、比赛时间节点、积分规则等

- **运动会届次管理**：支持多届运动会数据管理

### 学生功能

- **项目推荐**：在征集阶段提交项目建议
- **项目投票**：对推荐的项目进行投票
- **项目报名**：报名参加审核通过的比赛项目
- **成绩查询**：查看个人比赛成绩和积分排名
- **积分查询**：查看个人得分和班级排名

### 公开功能

- **实时看板**：公开展示比赛项目、成绩、排名等信息

## 权限系统

系统实现了基于角色的访问控制（RBAC），支持以下权限：

- 用户管理权限
- 学生与班级管理权限
- 项目管理权限
- 报名管理权限
- 成绩录入权限
- 成绩审核权限
- 网站管理权限

## 技术栈

### 后端

- **Go**：主要开发语言
- **Gin**：高性能 Web 框架
- **GORM**：ORM 框架
- **SQLite**：嵌入式数据库
- **JWT**：用户认证
- **钉钉 API**：支持钉钉登录

### 前端

- **React 18**：UI 框架
- **TypeScript**：类型安全
- **Ant Design 5**：UI 组件库
- **Vite**：构建工具
- **React Router 6**：路由管理
- **Axios**：HTTP 客户端
- **Day.js**：日期处理
- **Three.js**：3D 特效
- **xlsx-js-style**：Excel 导入导出

## 项目结构

```
sports-meeting-system/
├── api/                    # API 处理层
│   ├── handlers/          # 请求处理器
│   ├── middlewares/       # 中间件（认证、权限等）
│   └── routes/            # 路由定义
├── config/                # 配置管理
├── database/              # 数据库初始化
├── models/                # 数据模型
├── services/              # 业务逻辑层
├── types/                 # 类型定义
├── utils/                 # 工具函数
├── web/                   # 前端项目
│   ├── src/
│   │   ├── api/          # API 调用
│   │   ├── components/   # 通用组件
│   │   ├── contexts/     # React Context
│   │   ├── pages/        # 页面组件
│   │   ├── router/       # 路由配置
│   │   ├── types/        # TypeScript 类型
│   │   └── utils/        # 工具函数
│   └── dist/             # 构建产物（嵌入到 Go 二进制）
├── data/                  # 运行时数据目录
│   ├── sports.db         # SQLite 数据库
│   └── uploads/          # 上传文件
├── main.go               # 程序入口
├── config.json           # 配置文件
└── README.md             # 本文件
```

## 快速开始

### 前置要求

- Go 1.24 或更高版本
- Node.js 18 或更高版本
- pnpm（推荐）或 npm

### 开发环境

#### 1. 克隆项目

```bash
git clone https://github.com/itsHenry35/sports-meeting-system.git
cd sports-meeting-system
```

#### 2. 后端开发

```bash
# 运行后端服务
go run main.go
```

后端服务将在 `http://localhost:8080` 启动

#### 3. 前端开发

```bash
cd web

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端开发服务器将在 `http://localhost:5173` 启动

### 生产部署

#### 1. 构建前端

```bash
cd web
pnpm install
pnpm build
```

构建产物将输出到 `web/dist/` 目录

#### 2. 构建后端（嵌入前端）

```bash
# 构建 Linux 版本
GOOS=linux GOARCH=amd64 go build -o sports-meeting-system main.go

# 构建 Windows 版本
GOOS=windows GOARCH=amd64 go build -o sports-meeting-system.exe main.go

# 构建 macOS 版本
GOOS=darwin GOARCH=amd64 go build -o sports-meeting-system main.go
```

#### 3. 运行

```bash
# Linux/macOS
./sports-meeting-system

# Windows
sports-meeting-system.exe
```

系统会自动：
- 创建 `config.json` 配置文件（如果不存在）
- 初始化 SQLite 数据库并创建管理员账号
- 创建上传目录
- 启动 HTTP 服务器

## 配置说明

系统使用 `config.json` 文件进行配置，首次运行会自动生成默认配置。主要配置项：

```json
{
  "server": {
    "port": 8080,
    "host": "localhost"
  },
  "database": {
    "path": "./data/sports.db"
  },
  "dingtalk": {
    "app_key": "",
    "app_secret": "",
    "agent_id": "",
    "corp_id": ""
  },
  "security": {
    "jwt_secret": "请修改为随机字符串"
  },
  "website": {
    "name": "运动会管理系统",
    "icp_beian": "",
    "public_sec_beian": "",
    "domain": ""
  },
  "competition": {
    "submission_start_time": "",
    "submission_end_time": "",
    "voting_start_time": "",
    "voting_end_time": "",
    "registration_start_time": "",
    "registration_end_time": "",
    "max_registrations_per_person": 0
  },
  "dashboard": {
    "enabled": true
  },
  "current_event_id": 1,
  "scoring": {
    "team_points_mapping": {
      "1": 9, "2": 7, "3": 6, "4": 5, "5": 4, "6": 3, "7": 2, "8": 1
    },
    "individual_points_mapping": {
      "1": 7, "2": 5, "3": 4, "4": 3, "5": 2, "6": 1
    }
  }
}
```

### 重要配置项说明

- `server.port`：HTTP 服务端口
- `security.jwt_secret`：JWT 签名密钥，生产环境必须修改
- `dingtalk.*`：钉钉登录配置（可选）
- `competition.*`：比赛各阶段时间节点
- `scoring.*`：积分计算规则

## API 文档

### 认证 API

- `POST /api/login` - 用户登录
- `POST /api/dingtalk/login` - 钉钉登录

### 公开 API

- `GET /api/public/website_info` - 获取网站信息
- `GET /api/public/competitions` - 获取所有比赛项目
- `GET /api/public/competitions/:id` - 获取项目详情
- `GET /api/public/competitions/:id/scores` - 获取项目成绩
- `GET /api/public/statistics` - 获取统计信息
- `GET /api/public/points/classes/summary` - 班级积分汇总
- `GET /api/public/points/students/summary` - 学生积分汇总

### 管理员 API

所有管理员 API 需要认证和相应权限，详见 `api/routes/routes.go`

### 学生 API

所有学生 API 需要学生身份认证，详见 `api/routes/routes.go`

## 数据库

系统使用 SQLite 作为数据库，数据文件默认位于 `./data/sports.db`

主要数据表：

- `users` - 用户账号
- `students` - 学生信息
- `classes` - 班级信息
- `events` - 运动会届次
- `competitions` - 比赛项目
- `registrations` - 报名记录
- `scores` - 成绩记录
- `points` - 积分记录
- `votes` - 投票记录
- `parent_student_relations` - 钉钉家长-学生关联

## 开发指南

### 添加新的 API 端点

1. 在 `api/handlers/` 中创建处理函数
2. 在 `api/routes/routes.go` 中注册路由
3. 如需权限控制，使用相应的中间件

### 添加新的数据模型

1. 在 `models/` 中定义 GORM 模型
2. 在 `types/` 中定义 API 传输对象（DTO）
3. 在 `database/db.go` 中添加自动迁移

### 前端开发

1. 在 `web/src/pages/` 中创建页面组件
2. 在 `web/src/api/` 中定义 API 调用函数
3. 在 `web/src/router/AppRouter.tsx` 中注册路由
4. 使用 HandleResp 来处理所有API请求
5. 使用 Ant Design 组件保持 UI 一致性