package store

import (
    "database/sql"
    "errors"
    "fmt"

    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
)

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
