package store

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
)

func (s *Store) SearchUsers(query string, excludeProjectID *uuid.UUID, limit int) ([]models.User, error) {
	var users []models.User

	searchQuery := "%" + query + "%"

	var sqlQuery string
	var args []interface{}

	if excludeProjectID != nil {
		sqlQuery = `
            SELECT u.id, u.email, u.name, u.created_at, u.updated_at
            FROM users u
            WHERE (u.email ILIKE $1 OR u.name ILIKE $1)
            AND u.id NOT IN (
                SELECT user_id FROM project_members WHERE project_id = $2
            )
            AND u.email != 'physics-constants@system.local'
            ORDER BY u.name
            LIMIT $3
        `
		args = []interface{}{searchQuery, *excludeProjectID, limit}
	} else {
		sqlQuery = `
            SELECT id, email, name, created_at, updated_at
            FROM users
            WHERE (email ILIKE $1 OR name ILIKE $1)
            AND email != 'physics-constants@system.local'
            ORDER BY name
            LIMIT $2
        `
		args = []interface{}{searchQuery, limit}
	}

	err := s.db.Select(&users, sqlQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to search users: %w", err)
	}
	return users, nil
}

func (s *Store) CreateUser(user *models.User) error {
	query := `
        INSERT INTO users (id, email, password, name, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
    `
	_, err := s.db.Exec(query, user.ID, user.Email, user.Password, user.Name, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create user: %w", err)
	}
	return nil
}

func (s *Store) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	query := `SELECT * FROM users WHERE email = $1`
	err := s.db.Get(&user, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}

func (s *Store) GetUserByID(id uuid.UUID) (*models.User, error) {
	var user models.User
	query := `SELECT * FROM users WHERE id = $1`
	err := s.db.Get(&user, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	return &user, nil
}

func (s *Store) IsSystemUser(userID uuid.UUID) (bool, error) {
	var email string
	query := `SELECT email FROM users WHERE id = $1`
	err := s.db.Get(&email, query, userID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return false, nil
		}
		return false, fmt.Errorf("failed to check system user: %w", err)
	}
	const SystemUserEmail = "physics-constants@system.local"

	return email == SystemUserEmail, nil
}
