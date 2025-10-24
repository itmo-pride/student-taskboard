package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/config"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
    "github.com/itmo-pride/student-taskboard/backend/internal/services"
    "github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func SignUp(s *store.Store, cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req models.SignUpRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        existingUser, err := s.GetUserByEmail(req.Email)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if existingUser != nil {
            c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
            return
        }

        hashedPassword, err := services.HashPassword(req.Password)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
            return
        }

        user := &models.User{
            ID:        uuid.New(),
            Email:     req.Email,
            Password:  hashedPassword,
            Name:      req.Name,
            CreatedAt: time.Now(),
            UpdatedAt: time.Now(),
        }

        if err := s.CreateUser(user); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
            return
        }

        token, err := services.GenerateToken(user.ID, user.Email, cfg.JWTSecret, cfg.JWTExpiresIn)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
            return
        }

        c.JSON(http.StatusCreated, models.AuthResponse{
            Token: token,
            User:  *user,
        })
    }
}

func Login(s *store.Store, cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        var req models.LoginRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        user, err := s.GetUserByEmail(req.Email)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if user == nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
            return
        }

        if !services.CheckPassword(req.Password, user.Password) {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
            return
        }

        token, err := services.GenerateToken(user.ID, user.Email, cfg.JWTSecret, cfg.JWTExpiresIn)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
            return
        }

        c.JSON(http.StatusOK, models.AuthResponse{
            Token: token,
            User:  *user,
        })
    }
}

func GetMe(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        user, err := s.GetUserByID(userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if user == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
            return
        }

        c.JSON(http.StatusOK, user)
    }
}
