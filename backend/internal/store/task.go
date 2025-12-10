package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) CreateTask(task *models.Task) error {
	query := `
        INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, assigned_to, created_by, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `
	_, err := s.db.Exec(query, task.ID, task.ProjectID, task.Title, task.Description,
		task.Status, task.Priority, task.DueDate, task.AssignedTo, task.CreatedBy, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}
	return nil
}

func (s *Store) GetTasksByProject(projectID uuid.UUID) ([]models.Task, error) {
	var tasks []models.Task
	query := `SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC`
	err := s.db.Select(&tasks, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks: %w", err)
	}
	return tasks, nil
}

func (s *Store) GetTaskByID(id uuid.UUID) (*models.Task, error) {
	var task models.Task
	query := `SELECT * FROM tasks WHERE id = $1`
	err := s.db.Get(&task, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}
	return &task, nil
}

func (s *Store) UpdateTask(task *models.Task) error {
	query := `
        UPDATE tasks
        SET title = $1, description = $2, status = $3, priority = $4, due_date = $5, assigned_to = $6, updated_at = $7
        WHERE id = $8
    `
	_, err := s.db.Exec(query, task.Title, task.Description, task.Status,
		task.Priority, task.DueDate, task.AssignedTo, task.UpdatedAt, task.ID)
	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}
	return nil
}

func (s *Store) DeleteTask(id uuid.UUID) error {
	query := `DELETE FROM tasks WHERE id = $1`
	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}
	return nil
}

func (s *Store) GetTasksWithUpcomingDeadlines(projectID uuid.UUID, withinHours int) ([]models.Task, error) {
	var tasks []models.Task
	query := `
        SELECT * FROM tasks 
        WHERE project_id = $1 
          AND due_date IS NOT NULL 
          AND due_date <= NOW() + $2::interval
          AND status != 'done'
        ORDER BY due_date ASC
    `
	interval := fmt.Sprintf("%d hours", withinHours)
	err := s.db.Select(&tasks, query, projectID, interval)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks with deadlines: %w", err)
	}
	return tasks, nil
}
