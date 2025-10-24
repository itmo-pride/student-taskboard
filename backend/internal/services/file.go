package services

import (
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "strings"

    "github.com/google/uuid"
)

type FileService struct {
    UploadPath       string
    AllowedFileTypes []string
    MaxFileSize      int64
}

func NewFileService(uploadPath string, allowedTypes string, maxSize int64) *FileService {
    types := strings.Split(allowedTypes, ",")
    return &FileService{
        UploadPath:       uploadPath,
        AllowedFileTypes: types,
        MaxFileSize:      maxSize,
    }
}

func (fs *FileService) SaveFile(file *multipart.FileHeader) (string, string, error) {
    if file.Size > fs.MaxFileSize {
        return "", "", fmt.Errorf("file size exceeds maximum allowed size")
    }

    ext := strings.ToLower(filepath.Ext(file.Filename))
    if !fs.isAllowedType(ext) {
        return "", "", fmt.Errorf("file type not allowed: %s", ext)
    }

    filename := fmt.Sprintf("%s%s", uuid.New().String(), ext)
    filepath := filepath.Join(fs.UploadPath, filename)

    if err := os.MkdirAll(fs.UploadPath, os.ModePerm); err != nil {
        return "", "", fmt.Errorf("failed to create upload directory: %w", err)
    }

    src, err := file.Open()
    if err != nil {
        return "", "", fmt.Errorf("failed to open file: %w", err)
    }
    defer src.Close()

    dst, err := os.Create(filepath)
    if err != nil {
        return "", "", fmt.Errorf("failed to create file: %w", err)
    }
    defer dst.Close()

    if _, err := io.Copy(dst, src); err != nil {
        return "", "", fmt.Errorf("failed to save file: %w", err)
    }

    return filename, filepath, nil
}

func (fs *FileService) DeleteFile(filepath string) error {
    if err := os.Remove(filepath); err != nil && !os.IsNotExist(err) {
        return fmt.Errorf("failed to delete file: %w", err)
    }
    return nil
}

func (fs *FileService) isAllowedType(ext string) bool {
    for _, allowed := range fs.AllowedFileTypes {
        if strings.TrimSpace(allowed) == ext {
            return true
        }
    }
    return false
}
