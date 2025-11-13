package handlers

import (
	"net/http"

	"github.com/SHXZ-OSS/sports-meeting-system/services"
	"github.com/SHXZ-OSS/sports-meeting-system/utils"
	"github.com/gin-gonic/gin"
)

// LoginRequest 登录请求
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Token string `json:"token"`
	User  struct {
		ID         int    `json:"id"`
		Username   string `json:"username"`
		FullName   string `json:"full_name"`
		Role       string `json:"role"`
		Permission int    `json:"permission"`
	} `json:"user"`
}

// DingTalkLoginRequest 钉钉登录请求
type DingTalkLoginRequest struct {
	Code string `json:"code"`
}

// Login 用户登录
func Login(c *gin.Context) {
	// 解析请求
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ResponseError(c, http.StatusBadRequest, "无效请求")
		return
	}

	// 验证用户凭据
	token, user, err := services.Login(req.Username, req.Password)
	if err != nil {
		// 尝试学生登录
		studentLogin(c, req)
		return
	}

	// 构建响应
	resp := LoginResponse{
		Token: token,
		User: struct {
			ID         int    `json:"id"`
			Username   string `json:"username"`
			FullName   string `json:"full_name"`
			Role       string `json:"role"`
			Permission int    `json:"permission"`
		}{
			ID:         user.ID,
			Username:   user.Username,
			FullName:   user.FullName,
			Role:       string(services.RoleAdmin),
			Permission: user.Permission,
		},
	}

	// 返回响应
	utils.ResponseOK(c, resp)
}

// studentLogin 学生登录
func studentLogin(c *gin.Context, req LoginRequest) {
	// 验证学生凭据
	token, student, err := services.StudentLogin(req.Username, req.Password)
	if err != nil {
		utils.ResponseError(c, http.StatusUnauthorized, err.Error())
		return
	}
	// 构建响应
	resp := LoginResponse{
		Token: token,
		User: struct {
			ID         int    `json:"id"`
			Username   string `json:"username"`
			FullName   string `json:"full_name"`
			Role       string `json:"role"`
			Permission int    `json:"permission"`
		}{
			ID:         student.ID,
			Username:   student.Username,
			FullName:   student.FullName,
			Role:       string(services.RoleStudent),
			Permission: 0,
		},
	}
	// 返回响应
	utils.ResponseOK(c, resp)
}

// DingTalkLogin 钉钉登录
func DingTalkLogin(c *gin.Context) {
	// 解析请求
	var req DingTalkLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ResponseError(c, http.StatusBadRequest, "无效请求")
		return
	}

	// 进行钉钉免登录
	token, userObj, err := services.DingTalkLogin(req.Code)
	if err != nil {
		utils.ResponseError(c, http.StatusUnauthorized, err.Error())
		return
	}

	// 返回响应
	utils.ResponseOK(c, map[string]interface{}{
		"token": token,
		"user":  userObj,
	})
}
