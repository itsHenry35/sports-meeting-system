package utils

import (
	"crypto/rand"
	"encoding/base64"
	"math/big"
)

const (
	lowercaseChars = "abcdefghijklmnopqrstuvwxyz"
	uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	numberChars    = "0123456789"
	allChars       = lowercaseChars + uppercaseChars + numberChars
)

// GenerateRandomPassword 生成指定长度的随机密码
func GenerateRandomPassword(length int) (string, error) {
	if length < 8 {
		length = 8
	}

	password := make([]byte, length)

	// 确保密码至少包含一个小写字母
	randIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(lowercaseChars))))
	if err != nil {
		return "", err
	}
	password[0] = lowercaseChars[randIndex.Int64()]

	// 确保密码至少包含一个大写字母
	randIndex, err = rand.Int(rand.Reader, big.NewInt(int64(len(uppercaseChars))))
	if err != nil {
		return "", err
	}
	password[1] = uppercaseChars[randIndex.Int64()]

	// 确保密码至少包含一个数字
	randIndex, err = rand.Int(rand.Reader, big.NewInt(int64(len(numberChars))))
	if err != nil {
		return "", err
	}
	password[2] = numberChars[randIndex.Int64()]

	// 填充剩余位置
	for i := 3; i < length; i++ {
		randIndex, err = rand.Int(rand.Reader, big.NewInt(int64(len(allChars))))
		if err != nil {
			return "", err
		}
		password[i] = allChars[randIndex.Int64()]
	}

	// 打乱密码中字符的顺序
	for i := len(password) - 1; i > 0; i-- {
		j, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			return "", err
		}
		password[i], password[j.Int64()] = password[j.Int64()], password[i]
	}

	return string(password), nil
}

// GenerateSecureToken 生成安全的随机令牌
func GenerateSecureToken(length int) (string, error) {
	if length < 16 {
		length = 16
	}

	// 生成随机字节
	b := make([]byte, length)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}

	// 转换为Base64
	return base64.StdEncoding.EncodeToString(b)[:length], nil
}
