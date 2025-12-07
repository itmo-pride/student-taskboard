package store

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateBoard(board *models.Board) error {
	query := `
		INSERT INTO boards (id, project_id, name, data, settings, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := s.db.Exec(query, board.ID, board.ProjectID, board.Name,
		board.Data, board.Settings, board.CreatedAt, board.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create board: %w", err)
	}
	return nil
}

func (s *Store) GetBoardsByProject(projectID uuid.UUID) ([]models.Board, error) {
	var boards []models.Board
	query := `SELECT * FROM boards WHERE project_id = $1 ORDER BY created_at DESC`
	err := s.db.Select(&boards, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get boards: %w", err)
	}
	return boards, nil
}

func (s *Store) GetBoardByID(id uuid.UUID) (*models.Board, error) {
	var board models.Board
	query := `SELECT * FROM boards WHERE id = $1`
	err := s.db.Get(&board, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get board: %w", err)
	}
	return &board, nil
}

func (s *Store) UpdateBoardData(boardID uuid.UUID, data json.RawMessage) error {
	query := `
		UPDATE boards 
		SET data = $1, updated_at = $2 
		WHERE id = $3
	`
	_, err := s.db.Exec(query, data, time.Now(), boardID)
	if err != nil {
		return fmt.Errorf("failed to update board data: %w", err)
	}
	return nil
}

func (s *Store) UpdateBoard(board *models.Board) error {
	query := `
		UPDATE boards 
		SET name = $1, updated_at = $2 
		WHERE id = $3
	`
	_, err := s.db.Exec(query, board.Name, time.Now(), board.ID)
	if err != nil {
		return fmt.Errorf("failed to update board: %w", err)
	}
	return nil
}

func (s *Store) DeleteBoard(id uuid.UUID) error {
	query := `DELETE FROM boards WHERE id = $1`
	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete board: %w", err)
	}
	return nil
}

func (s *Store) AddObjectToBoard(boardID uuid.UUID, object models.DrawObject) error {
	objectJSON, err := json.Marshal(object)
	if err != nil {
		return fmt.Errorf("failed to marshal object: %w", err)
	}

	query := `
		UPDATE boards 
		SET 
			data = jsonb_set(
				COALESCE(data, '{"objects":[],"version":0}'::jsonb),
				'{objects}',
				COALESCE(data->'objects', '[]'::jsonb) || $1::jsonb
			),
			updated_at = $2
		WHERE id = $3
	`
	_, err = s.db.Exec(query, objectJSON, time.Now(), boardID)
	if err != nil {
		return fmt.Errorf("failed to add object to board: %w", err)
	}
	return nil
}

func (s *Store) RemoveObjectFromBoard(boardID uuid.UUID, objectID string) error {
	query := `
		UPDATE boards 
		SET 
			data = jsonb_set(
				data,
				'{objects}',
				(SELECT COALESCE(jsonb_agg(obj), '[]'::jsonb)
				 FROM jsonb_array_elements(data->'objects') obj
				 WHERE obj->>'id' != $1)
			),
			updated_at = $2
		WHERE id = $3
	`
	_, err := s.db.Exec(query, objectID, time.Now(), boardID)
	if err != nil {
		return fmt.Errorf("failed to remove object from board: %w", err)
	}
	return nil
}

func (s *Store) ClearBoard(boardID uuid.UUID) error {
	query := `
		UPDATE boards 
		SET 
			data = '{"objects":[],"version":0}'::jsonb,
			updated_at = $1
		WHERE id = $2
	`
	_, err := s.db.Exec(query, time.Now(), boardID)
	if err != nil {
		return fmt.Errorf("failed to clear board: %w", err)
	}
	return nil
}
