package store

import (
    "database/sql"
    "errors"
    "fmt"

    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateFormula(formula *models.Formula) error {
    query := `
        INSERT INTO formulas (id, title, latex, description, project_id, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    _, err := s.db.Exec(query, formula.ID, formula.Title, formula.Latex, 
        formula.Description, formula.ProjectID, formula.CreatedBy, formula.CreatedAt, formula.UpdatedAt)
    if err != nil {
        return fmt.Errorf("failed to create formula: %w", err)
    }
    return nil
}

func (s *Store) GetFormulas(userID uuid.UUID, projectID *uuid.UUID) ([]models.Formula, error) {
    var formulas []models.Formula
    
    query := `
        SELECT * FROM formulas 
        WHERE created_by = $1 OR project_id = $2
        ORDER BY created_at DESC
    `
    
    err := s.db.Select(&formulas, query, userID, projectID)
    if err != nil {
        return nil, fmt.Errorf("failed to get formulas: %w", err)
    }
    return formulas, nil
}

func (s *Store) GetFormulaByID(id uuid.UUID) (*models.Formula, error) {
    var formula models.Formula
    query := `SELECT * FROM formulas WHERE id = $1`
    err := s.db.Get(&formula, query, id)
    if err != nil {
        if errors.Is(err, sql.ErrNoRows) {
            return nil, nil
        }
        return nil, fmt.Errorf("failed to get formula: %w", err)
    }
    return &formula, nil
}

func (s *Store) UpdateFormula(formula *models.Formula) error {
    query := `
        UPDATE formulas
        SET title = $1, latex = $2, description = $3, updated_at = $4
        WHERE id = $5
    `
    _, err := s.db.Exec(query, formula.Title, formula.Latex, 
        formula.Description, formula.UpdatedAt, formula.ID)
    if err != nil {
        return fmt.Errorf("failed to update formula: %w", err)
    }
    return nil
}

func (s *Store) DeleteFormula(id uuid.UUID) error {
    query := `DELETE FROM formulas WHERE id = $1`
    _, err := s.db.Exec(query, id)
    if err != nil {
        return fmt.Errorf("failed to delete formula: %w", err)
    }
    return nil
}
