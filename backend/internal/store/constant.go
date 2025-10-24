package store

import (
    "database/sql"
    "errors"
    "fmt"

    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateConstant(constant *models.Constant) error {
    query := `
        INSERT INTO constants (id, name, symbol, value, unit, description, scope, scope_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `
    _, err := s.db.Exec(query, constant.ID, constant.Name, constant.Symbol, constant.Value,
        constant.Unit, constant.Description, constant.Scope, constant.ScopeID, 
        constant.CreatedBy, constant.CreatedAt, constant.UpdatedAt)
    if err != nil {
        return fmt.Errorf("failed to create constant: %w", err)
    }
    return nil
}

func (s *Store) GetConstants(userID uuid.UUID, projectID *uuid.UUID, scope string) ([]models.Constant, error) {
    var constants []models.Constant
    
    query := `
        SELECT * FROM constants 
        WHERE (scope = 'global') 
           OR (scope = 'user' AND created_by = $1)
           OR (scope = 'project' AND scope_id = $2)
        ORDER BY created_at DESC
    `
    
    err := s.db.Select(&constants, query, userID, projectID)
    if err != nil {
        return nil, fmt.Errorf("failed to get constants: %w", err)
    }
    return constants, nil
}

func (s *Store) GetConstantByID(id uuid.UUID) (*models.Constant, error) {
    var constant models.Constant
    query := `SELECT * FROM constants WHERE id = $1`
    err := s.db.Get(&constant, query, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to get constant: %w", err)
    }
    return &constant, nil
}

func (s *Store) UpdateConstant(constant *models.Constant) error {
    query := `
        UPDATE constants
        SET name = $1, symbol = $2, value = $3, unit = $4, description = $5, updated_at = $6
        WHERE id = $7
    `
    _, err := s.db.Exec(query, constant.Name, constant.Symbol, constant.Value,
        constant.Unit, constant.Description, constant.UpdatedAt, constant.ID)
    if err != nil {
        return fmt.Errorf("failed to update constant: %w", err)
    }
    return nil
}

func (s *Store) DeleteConstant(id uuid.UUID) error {
    query := `DELETE FROM constants WHERE id = $1`
    _, err := s.db.Exec(query, id)
    if err != nil {
        return fmt.Errorf("failed to delete constant: %w", err)
    }
    return nil
}
