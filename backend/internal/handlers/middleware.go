package handlers

import (
    "net/http"
    "strings"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/config"
    "github.com/itmo-pride/student-taskboard/backend/internal/services"
    "github.com/itmo-pride/student-taskboard/backend/internal/ws"
)

func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "authorization header required"})
            c.Abort()
            return
        }

        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
            c.Abort()
            return
        }

        token := parts[1]
        claims, err := services.ValidateToken(token, cfg.JWTSecret)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }

        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Next()
    }
}

func AuthMiddlewareWS(cfg *config.Config) gin.HandlerFunc {
    return func(c *gin.Context) {
        token := c.Query("token")
        if token == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "token required"})
            c.Abort()
            return
        }

        claims, err := services.ValidateToken(token, cfg.JWTSecret)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
            c.Abort()
            return
        }

        c.Set("user_id", claims.UserID)
        c.Set("user_email", claims.Email)
        c.Next()
    }
}

func getUserID(c *gin.Context) (uuid.UUID, error) {
    userID, exists := c.Get("user_id")
    if !exists {
        return uuid.Nil, gin.Error{Err: http.ErrNotSupported}
    }
    return userID.(uuid.UUID), nil
}

func ServeWS(hub *ws.Hub) gin.HandlerFunc {
    return ws.ServeWS(hub)
}

