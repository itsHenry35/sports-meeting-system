package models

import (
	"fmt"

	"github.com/SHXZ-OSS/sports-meeting-system/database"
	"github.com/SHXZ-OSS/sports-meeting-system/types"
	"github.com/SHXZ-OSS/sports-meeting-system/utils"
)

// RegisterForCompetitionForStudent 学生报名比赛（个人赛和团体赛都以学生为单位）
func RegisterForCompetitionForStudent(studentID *int, classID *int, competitionID int, user *types.User) error {
	// 获取数据库连接和验证器
	db := database.GetDB()
	validator := utils.NewRegistrationValidator(db)

	// 使用验证器验证报名请求
	if err := validator.ValidateRegistration(studentID, classID, competitionID, user); err != nil {
		return err
	}

	// 如果没有提供classID，从学生信息中获取
	if classID == nil && studentID != nil {
		student, err := GetStudentByID(*studentID)
		if err == nil {
			classID = &student.ClassID
		}
	}

	// 创建报名记录
	registration := &types.Registration{
		StudentID:     studentID,
		ClassID:       classID,
		CompetitionID: competitionID,
	}
	return db.Create(registration).Error
}

// UnregisterFromCompetition 取消报名
func UnregisterFromCompetition(studentID *int, classID *int, competitionID int, user *types.User) error {
	// 获取数据库连接和验证器
	db := database.GetDB()
	validator := utils.NewRegistrationValidator(db)

	// 使用验证器验证取消报名请求
	if err := validator.ValidateUnregistration(studentID, classID, competitionID, user); err != nil {
		return err
	}

	// 删除报名记录
	result := db.Where("student_id = ? AND competition_id = ?", *studentID, competitionID).Delete(&types.Registration{})

	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return utils.ErrNotRegistered
	}

	return nil
}

// GetCompetitionRegistrations 获取比赛的报名列表（支持班级scope）
// scopeClassIDs: 可选的班级ID列表，用于过滤报名记录。如果为nil，则返回所有报名记录
func GetCompetitionRegistrations(competitionID int, scopeClassIDs *[]int) ([]*types.Registration, error) {
	// 获取数据库连接
	db := database.GetDB()

	// 构建查询
	query := db.Preload("Student.Class").Where("competition_id = ?", competitionID)

	// 如果提供了scopeClassIDs，应用班级scope过滤
	if scopeClassIDs != nil {
		if len(*scopeClassIDs) == 0 {
			// 没有任何班级权限，返回空列表
			return []*types.Registration{}, nil
		}
		query = query.Where("class_id IN ?", *scopeClassIDs)
	}

	// 查询报名记录，包含学生、班级信息
	var registrations []*types.Registration
	err := query.Order("created_at DESC").Find(&registrations).Error
	if err != nil {
		return nil, err
	}

	// 填充学生和班级信息
	for _, reg := range registrations {
		if reg.StudentID != nil && reg.Student != nil && reg.Student.ID > 0 {
			reg.StudentName = reg.Student.FullName
			reg.StudentGender = reg.Student.Gender
			if reg.Student.Class.ID > 0 {
				reg.ClassName = reg.Student.Class.Name
				// 填充ClassID字段（用于成绩录入）
				reg.ClassID = &reg.Student.ClassID
			}
		}
	}

	return registrations, nil
}

// GetStudentRegistrationsByStudentID 获取学生的报名记录
func GetStudentRegistrationsByStudentID(studentID int) ([]*types.Competition, error) {
	// 获取数据库连接
	db := database.GetDB()

	// 查询学生报名的比赛
	var registrations []*types.Registration
	err := db.Preload("Competition.Submitter").Preload("Competition.Reviewer").Where("student_id = ?", studentID).Order("created_at DESC").Find(&registrations).Error
	if err != nil {
		return nil, err
	}

	// 提取比赛信息
	var competitions []*types.Competition
	for _, reg := range registrations {
		comp := &reg.Competition

		// 设置衍生字段
		if comp.Submitter != nil {
			submitterName := comp.Submitter.FullName
			comp.SubmitterName = &submitterName
		}
		if comp.Reviewer != nil {
			comp.ReviewerName = comp.Reviewer.FullName
		}

		competitions = append(competitions, comp)
	}

	return competitions, nil
}

// GetCompetitionChecklist 获取比赛报名检查清单
// scopeClassIDs: 可选的班级ID列表，用于过滤检查范围。如果为nil，则检查所有班级
func GetCompetitionChecklist(scopeClassIDs *[]int) ([]map[string]any, error) {
	db := database.GetDB()

	// 获取所有比赛项目
	var competitions []types.Competition
	if err := db.Find(&competitions).Error; err != nil {
		return nil, err
	}

	// 如果提供了scopeClassIDs且为空，返回空列表
	if scopeClassIDs != nil && len(*scopeClassIDs) == 0 {
		return []map[string]any{}, nil
	}

	// 检查每个项目
	var results []map[string]any
	for _, comp := range competitions {
		// 查询该项目的报名情况
		var registrations []types.Registration
		query := db.Where("competition_id = ?", comp.ID)

		// 如果提供了scopeClassIDs，只查询scope内的报名
		if scopeClassIDs != nil && len(*scopeClassIDs) > 0 {
			query = query.Where("class_id IN ?", *scopeClassIDs)
		}

		if err := query.Find(&registrations).Error; err != nil {
			continue
		}

		// 按班级统计报名人数
		classRegistrationCount := make(map[int]int)
		for _, reg := range registrations {
			if reg.ClassID != nil {
				classRegistrationCount[*reg.ClassID]++
			}
		}

		// 检查每个班级是否符合要求
		var classes []types.Class
		if scopeClassIDs != nil && len(*scopeClassIDs) > 0 {
			// 只检查scope内的班级
			db.Where("id IN ?", *scopeClassIDs).Find(&classes)
		} else {
			// 检查所有班级
			db.Find(&classes)
		}

		// 收集所有不符合要求的班级
		var issues []map[string]any
		allOk := true

		for _, class := range classes {
			count := classRegistrationCount[class.ID]

			// 检查最少报名人数
			if comp.MinParticipantsPerClass > 0 && count < comp.MinParticipantsPerClass {
				allOk = false
				issues = append(issues, map[string]any{
					"competition_id":   comp.ID,
					"competition_name": comp.Name,
					"status":           "error",
					"message":          fmt.Sprintf("班级 %s 报名人数不足（%d/%d）", class.Name, count, comp.MinParticipantsPerClass),
				})
			}

			// 检查最多报名人数
			if comp.MaxParticipantsPerClass > 0 && count > comp.MaxParticipantsPerClass {
				allOk = false
				issues = append(issues, map[string]any{
					"competition_id":   comp.ID,
					"competition_name": comp.Name,
					"status":           "error",
					"message":          fmt.Sprintf("班级 %s 报名人数超出上限（%d/%d）", class.Name, count, comp.MaxParticipantsPerClass),
				})
			}
		}

		// 如果所有班级都符合要求，添加一条"所有班级符合要求"的记录
		if allOk {
			results = append(results, map[string]any{
				"competition_id":   comp.ID,
				"competition_name": comp.Name,
				"status":           "ok",
				"message":          "所有班级报名人数符合要求",
			})
		} else {
			// 否则添加所有不符合要求的记录
			results = append(results, issues...)
		}
	}

	return results, nil
}
