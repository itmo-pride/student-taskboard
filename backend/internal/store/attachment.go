package store

import (
    "database/sql"
    "errors"
    "fmt"

    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateAttachment(attachment *models.Attachment) error {
    query := `
        INSERT INTO attachments (id, filename, original_name, file_path, file_size, mime_type, entity_type, entity_id, uploaded_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `
    _, err := s.db.Exec(query, attachment.ID, attachment.Filename, attachment.OriginalName,
        attachment.FilePath, attachment.FileSize, attachment.MimeType, attachment.EntityType,
        attachment.EntityID, attachment.UploadedBy, attachment.CreatedAt)
    if err != nil {
        return fmt.Errorf("failed to create attachment: %w", err)
    }
    return nil
}

func (s *Store) GetAttachmentByID(id uuid.UUID) (*models.Attachment, error) {
    var attachment models.Attachment
    query := `SELECT * FROM attachments WHERE id = $1`
    err := s.db.Get(&attachment, query, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to get attachment: %w", err)
    }
    return &attachment, nil
}

func (s *Store) GetAttachmentsByEntity(entityType string, entityID uuid.UUID) ([]models.Attachment, error) {
    var attachments []models.Attachment
    query := `SELECT * FROM attachments WHERE entity_type = $1 AND entity_id = $2 ORDER BY created_at DESC`
    err := s.db.Select(&attachments, query, entityType, entityID)
    if err != nil {
        return nil, fmt.Errorf("failed to get attachments: %w", err)
    }
    return attachments, nil
}

func (s *Store) DeleteAttachment(id uuid.UUID) error {
    query := `DELETE FROM attachments WHERE id = $1`
    _, err := s.db.Exec(query, id)
    if err != nil {
        return fmt.Errorf("failed to delete attachment: %w", err)
    }
    return nil
}
