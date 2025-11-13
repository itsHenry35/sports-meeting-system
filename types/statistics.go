package types

// Statistics 统计信息模型
type Statistics struct {
	LatestCompetition         *Competition           `json:"latest_competition,omitempty"`
	LatestScores              []*Score               `json:"latest_scores,omitempty"`
	CompletedCompetitionCount int                    `json:"completed_competition_count"`
	RemainingCompetitionCount int                    `json:"remaining_competition_count"`
	TopClasses                []ClassPointsSummary   `json:"top_classes,omitempty"`  // 前8名班级
	TopStudents               []StudentPointsSummary `json:"top_students,omitempty"` // 前8名学生
}
