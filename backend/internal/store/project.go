package store

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
)

type ProjectMemberWithUser struct {
	ID        uuid.UUID `json:"id" db:"id"`
	ProjectID uuid.UUID `json:"project_id" db:"project_id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Role      string    `json:"role" db:"role"`
	JoinedAt  time.Time `json:"joined_at" db:"joined_at"`
	UserName  string    `json:"user_name" db:"user_name"`
	UserEmail string    `json:"user_email" db:"user_email"`
}

func (s *Store) GetProjectMembers(projectID uuid.UUID) ([]ProjectMemberWithUser, error) {
	var members []ProjectMemberWithUser
	query := `
        SELECT 
            pm.id,
            pm.project_id,
            pm.user_id,
            pm.role,
            pm.joined_at,
            u.name as user_name,
            u.email as user_email
        FROM project_members pm
        INNER JOIN users u ON pm.user_id = u.id
        WHERE pm.project_id = $1
        ORDER BY pm.joined_at ASC
    `
	err := s.db.Select(&members, query, projectID)
	if err != nil {
		return nil, fmt.Errorf("failed to get project members: %w", err)
	}
	return members, nil
}

func (s *Store) CreateProject(project *models.Project) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	query := `
        INSERT INTO projects (id, name, description, owner_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
	_, err = tx.Exec(query, project.ID, project.Name, project.Description, project.OwnerID, project.CreatedAt, project.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create project: %w", err)
	}

	memberQuery := `
        INSERT INTO project_members (id, project_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4, $5)
    `
	_, err = tx.Exec(memberQuery, uuid.New(), project.ID, project.OwnerID, "owner", project.CreatedAt)
	if err != nil {
		return fmt.Errorf("failed to add owner as member: %w", err)
	}

	return tx.Commit()
}

func (s *Store) GetProjectsByUser(userID uuid.UUID) ([]models.Project, error) {
	var projects []models.Project
	query := `
        SELECT p.* FROM projects p
        INNER JOIN project_members pm ON p.id = pm.project_id
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
    `
	err := s.db.Select(&projects, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get projects: %w", err)
	}
	return projects, nil
}

func (s *Store) GetProjectByID(id uuid.UUID) (*models.Project, error) {
	var project models.Project
	query := `SELECT * FROM projects WHERE id = $1`
	err := s.db.Get(&project, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get project: %w", err)
	}
	return &project, nil
}

func (s *Store) UpdateProject(project *models.Project) error {
	query := `
        UPDATE projects
        SET name = $1, description = $2, updated_at = $3
        WHERE id = $4
    `
	_, err := s.db.Exec(query, project.Name, project.Description, project.UpdatedAt, project.ID)
	if err != nil {
		return fmt.Errorf("failed to update project: %w", err)
	}
	return nil
}

func (s *Store) DeleteProject(id uuid.UUID) error {
	query := `DELETE FROM projects WHERE id = $1`
	_, err := s.db.Exec(query, id)
	if err != nil {
		return fmt.Errorf("failed to delete project: %w", err)
	}
	return nil
}

func (s *Store) IsProjectMember(projectID, userID uuid.UUID) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2)`
	err := s.db.Get(&exists, query, projectID, userID)
	if err != nil {
		return false, fmt.Errorf("failed to check membership: %w", err)
	}
	return exists, nil
}

func (s *Store) AddProjectMember(member *models.ProjectMember) error {
	query := `
        INSERT INTO project_members (id, project_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4, $5)
    `
	_, err := s.db.Exec(query, member.ID, member.ProjectID, member.UserID, member.Role, member.JoinedAt)
	if err != nil {
		return fmt.Errorf("failed to add member: %w", err)
	}
	return nil
}

func (s *Store) RemoveProjectMember(projectID, userID uuid.UUID) error {
	query := `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2 AND role != 'owner'`
	_, err := s.db.Exec(query, projectID, userID)
	if err != nil {
		return fmt.Errorf("failed to remove member: %w", err)
	}
	return nil
}
