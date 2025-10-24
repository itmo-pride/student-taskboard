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

func UploadAttachment(s *store.Store, cfg *config.Config) gin.HandlerFunc {
    fileService := services.NewFileService(cfg.UploadPath, cfg.AllowedFileTypes, cfg.MaxUploadSize)

    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        file, err := c.FormFile("file")
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
            return
        }

        entityType := c.PostForm("entity_type")
        entityIDStr := c.PostForm("entity_id")

        if entityType == "" || entityIDStr == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "entity_type and entity_id required"})
            return
        }

        entityID, err := uuid.Parse(entityIDStr)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_id"})
            return
        }

        switch entityType {
        case "project":
            isMember, err := s.IsProjectMember(entityID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        case "task":
            task, err := s.GetTaskByID(entityID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if task == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
                return
            }
            isMember, err := s.IsProjectMember(task.ProjectID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        case "formula":
            formula, err := s.GetFormulaByID(entityID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if formula == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "formula not found"})
                return
            }
            if formula.CreatedBy != userID {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        default:
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid entity_type"})
            return
        }

        filename, filepath, err := fileService.SaveFile(file)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        attachment := &models.Attachment{
            ID:           uuid.New(),
            Filename:     filename,
            OriginalName: file.Filename,
            FilePath:     filepath,
            FileSize:     file.Size,
            MimeType:     file.Header.Get("Content-Type"),
            EntityType:   entityType,
            EntityID:     entityID,
            UploadedBy:   userID,
            CreatedAt:    time.Now(),
        }

        if err := s.CreateAttachment(attachment); err != nil {
            fileService.DeleteFile(filepath)
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create attachment"})
            return
        }

        c.JSON(http.StatusCreated, attachment)
    }
}

func GetAttachment(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        attachmentID, err := uuid.Parse(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attachment id"})
            return
        }

        attachment, err := s.GetAttachmentByID(attachmentID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get attachment"})
            return
        }
        if attachment == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
            return
        }

        switch attachment.EntityType {
        case "project":
            isMember, err := s.IsProjectMember(attachment.EntityID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        case "task":
            task, err := s.GetTaskByID(attachment.EntityID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if task == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
                return
            }
            isMember, err := s.IsProjectMember(task.ProjectID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        case "formula":
            formula, err := s.GetFormulaByID(attachment.EntityID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if formula == nil {
                c.JSON(http.StatusNotFound, gin.H{"error": "formula not found"})
                return
            }
            if formula.CreatedBy != userID {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        }

        c.JSON(http.StatusOK, attachment)
    }
}

func DeleteAttachment(s *store.Store, cfg *config.Config) gin.HandlerFunc {
    fileService := services.NewFileService(cfg.UploadPath, cfg.AllowedFileTypes, cfg.MaxUploadSize)

    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        attachmentID, err := uuid.Parse(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid attachment id"})
            return
        }

        attachment, err := s.GetAttachmentByID(attachmentID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if attachment == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "attachment not found"})
            return
        }

        if attachment.UploadedBy != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only uploader can delete attachment"})
            return
        }

        if err := s.DeleteAttachment(attachmentID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete attachment"})
            return
        }

        fileService.DeleteFile(attachment.FilePath)

        c.JSON(http.StatusOK, gin.H{"message": "attachment deleted"})
    }
}
