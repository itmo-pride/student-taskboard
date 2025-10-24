package config

import (
    "fmt"
    "os"
    "time"

    "github.com/joho/godotenv"
)

type Config struct {
    Port     string
    Env      string
    
    DBHost     string
    DBPort     string
    DBUser     string
    DBPassword string
    DBName     string
    DBSSLMode  string
    
    JWTSecret    string
    JWTExpiresIn time.Duration
    
    UploadPath        string
    MaxUploadSize     int64
    AllowedFileTypes  string
    
    UseS3         bool
    S3Bucket      string
    S3Region      string
    S3AccessKey   string
    S3SecretKey   string
}

func Load() (*Config, error) {
    godotenv.Load()

    jwtExpiresIn, err := time.ParseDuration(getEnv("JWT_EXPIRES_IN", "24h"))
    if err != nil {
        return nil, fmt.Errorf("invalid JWT_EXPIRES_IN: %w", err)
    }

    return &Config{
        Port: getEnv("PORT", "8080"),
        Env:  getEnv("ENV", "development"),
        
        DBHost:     getEnv("DB_HOST", "localhost"),
        DBPort:     getEnv("DB_PORT", "5432"),
        DBUser:     getEnv("DB_USER", "postgres"),
        DBPassword: getEnv("DB_PASSWORD", "postgres"),
        DBName:     getEnv("DB_NAME", "physics_collab"),
        DBSSLMode:  getEnv("DB_SSLMODE", "disable"),
        
        JWTSecret:    getEnv("JWT_SECRET", "change-me-in-production"),
        JWTExpiresIn: jwtExpiresIn,
        
        UploadPath:       getEnv("UPLOAD_PATH", "./uploads"),
        MaxUploadSize:    10485760, // 10MB
        AllowedFileTypes: getEnv("ALLOWED_FILE_TYPES", ".pdf,.png,.jpg,.jpeg,.tex,.txt"),
        
        UseS3:       getEnv("USE_S3", "false") == "true",
        S3Bucket:    getEnv("S3_BUCKET", ""),
        S3Region:    getEnv("S3_REGION", ""),
        S3AccessKey: getEnv("S3_ACCESS_KEY", ""),
        S3SecretKey: getEnv("S3_SECRET_KEY", ""),
    }, nil
}

func getEnv(key, defaultValue string) string {
    if value := os.Getenv(key); value != "" {
        return value
    }
    return defaultValue
}
