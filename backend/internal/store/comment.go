package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateComment(comment *models.TaskComment) error {
	query := `
		INSERT INTO task_comments (id, task_id, user_id, content, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := s.db.Exec(query, comment.ID, comment.TaskID, comment.UserID,
		comment.Content, comment.CreatedAt, comment.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create comment: %w", err)
	}
	return nil
}

func (s *Store) GetCommentsByTaskID(taskID uuid.UUID) ([]models.TaskCommentWithUser, error) {
	var comments []models.TaskCommentWithUser
	query := `
		SELECT 
			c.id,
			c.task_id,
			c.user_id,
			c.content,
			c.created_at,
			c.updated_at,
			u.name as user_name,
			u.email as user_email
		FROM task_comments c
		INNER JOIN users u ON c.user_id = u.id
		WHERE c.task_id = $1
		ORDER BY c.created_at ASC
	`
	err := s.db.Select(&comments, query, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to get comments: %w", err)
	}
	return comments, nil
}

func (s *Store) GetCommentByID(id uuid.UUID) (*models.TaskComment, error) {
	var comment models.TaskComment
	query := `SELECT * FROM task_comments WHERE id = $1`
	err := s.db.Get(&comment, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get comment: %w", err)
	}
	return &comment, nil
}

func (s *Store) UpdateComment(comment *models.TaskComment) error {
	query := `
		UPDATE task_comments
		SET content = $1, updated_at = $2
		WHERE id = $3
	`
	_, err := s.db.Exec(query, comment.Content, comment.UpdatedAt, comment.ID)
	if err != nil {
		return fmt.Errorf("failed to update comment: %w", err)
	}
	return nil
}

func (s *Store) DeleteComment(id uuid.UUID) error {
	query := `DELETE FROM task_comments WHERE id = $1`
	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete comment: %w", err)
	}
	return nil
}

func (s *Store) GetCommentCountByTaskID(taskID uuid.UUID) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM task_comments WHERE task_id = $1`
	err := s.db.Get(&count, query, taskID)
	if err != nil {
		return 0, fmt.Errorf("failed to get comment count: %w", err)
	}
	return count, nil
}
