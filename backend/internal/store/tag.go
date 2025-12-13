package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/lib/pq"
)

func (s *Store) CreateTag(tag *models.Tag) error {
	query := `
		INSERT INTO tags (id, project_id, name, color, created_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`
	_, err := s.db.Exec(query, tag.ID, tag.ProjectID, tag.Name, tag.Color, tag.CreatedBy, tag.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to create tag: %w", err)
	}
	return nil
}

func (s *Store) GetTagsByProject(projectID uuid.UUID) ([]models.TagWithCount, error) {
	var tags []models.TagWithCount
	query := `
		SELECT 
			t.id, t.project_id, t.name, t.color, t.created_by, t.created_at,
			COUNT(tt.task_id) as task_count
		FROM tags t
		LEFT JOIN task_tags tt ON t.id = tt.tag_id
		WHERE t.project_id = $1
		GROUP BY t.id
		ORDER BY t.name ASC
	`
	err := s.db.Select(&tags, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tags: %w", err)
	}
	return tags, nil
}

func (s *Store) GetTagByID(id uuid.UUID) (*models.Tag, error) {
	var tag models.Tag
	query := `SELECT * FROM tags WHERE id = $1`
	err := s.db.Get(&tag, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get tag: %w", err)
	}
	return &tag, nil
}

func (s *Store) UpdateTag(tag *models.Tag) error {
	query := `
		UPDATE tags
		SET name = $1, color = $2
		WHERE id = $3
	`
	_, err := s.db.Exec(query, tag.Name, tag.Color, tag.ID)
	if err != nil {
		return fmt.Errorf("failed to update tag: %w", err)
	}
	return nil
}

func (s *Store) DeleteTag(id uuid.UUID) error {
	query := `DELETE FROM tags WHERE id = $1`
	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete tag: %w", err)
	}
	return nil
}

func (s *Store) AddTagToTask(taskID, tagID uuid.UUID) error {
	query := `
		INSERT INTO task_tags (task_id, tag_id, created_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (task_id, tag_id) DO NOTHING
	`
	_, err := s.db.Exec(query, taskID, tagID)
	if err != nil {
		return fmt.Errorf("failed to add tag to task: %w", err)
	}
	return nil
}

func (s *Store) RemoveTagFromTask(taskID, tagID uuid.UUID) error {
	query := `DELETE FROM task_tags WHERE task_id = $1 AND tag_id = $2`
	_, err := s.db.Exec(query, taskID, tagID)
	if err != nil {
		return fmt.Errorf("failed to remove tag from task: %w", err)
	}
	return nil
}

func (s *Store) GetTagsByTask(taskID uuid.UUID) ([]models.Tag, error) {
	var tags []models.Tag
	query := `
		SELECT t.* FROM tags t
		INNER JOIN task_tags tt ON t.id = tt.tag_id
		WHERE tt.task_id = $1
		ORDER BY t.name ASC
	`
	err := s.db.Select(&tags, query, taskID)
	if err != nil {
		return nil, fmt.Errorf("failed to get tags for task: %w", err)
	}
	return tags, nil
}

func (s *Store) GetTasksByTags(projectID uuid.UUID, tagIDs []uuid.UUID) ([]models.Task, error) {
	if len(tagIDs) == 0 {
		return s.GetTasksByProject(projectID)
	}

	var tasks []models.Task
	query := `
	SELECT DISTINCT t.* FROM tasks t
	INNER JOIN task_tags tt ON t.id = tt.task_id
	WHERE t.project_id = $1 AND tt.tag_id = ANY($2::uuid[])
	ORDER BY t.created_at DESC
	`

	tagStrings := make([]string, len(tagIDs))
	for i, id := range tagIDs {
		tagStrings[i] = id.String()
	}

	err := s.db.Select(&tasks, query, projectID, pq.Array(tagStrings))
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks by tags: %w", err)
	}
	return tasks, nil
}

func (s *Store) GetTasksWithTags(projectID uuid.UUID, filterTagIDs []uuid.UUID) ([]models.Task, error) {
	var tasks []models.Task
	var err error

	if len(filterTagIDs) > 0 {
		tasks, err = s.GetTasksByTags(projectID, filterTagIDs)
	} else {
		tasks, err = s.GetTasksByProject(projectID)
	}

	if err != nil {
		return nil, err
	}

	for i := range tasks {
		tags, err := s.GetTagsByTask(tasks[i].ID)
		if err != nil {
			return nil, err
		}
		tasks[i].Tags = tags
	}

	return tasks, nil
}
