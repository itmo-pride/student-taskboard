package models

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Board struct {
	ID        uuid.UUID       `json:"id" db:"id"`
	ProjectID uuid.UUID       `json:"project_id" db:"project_id"`
	Name      string          `json:"name" db:"name"`
	Data      json.RawMessage `json:"data" db:"data"`
	Settings  json.RawMessage `json:"settings" db:"settings"`
	CreatedAt time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt time.Time       `json:"updated_at" db:"updated_at"`
}

type BoardData struct {
	Objects []DrawObject `json:"objects"`
	Version int          `json:"version"`
}

type DrawObject struct {
	ID        string    `json:"id"`
	Type      string    `json:"type"`
	Points    []Point   `json:"points,omitempty"`
	X         float64   `json:"x,omitempty"`
	Y         float64   `json:"y,omitempty"`
	Width     float64   `json:"width,omitempty"`
	Height    float64   `json:"height,omitempty"`
	Radius    float64   `json:"radius,omitempty"`
	Text      string    `json:"text,omitempty"`
	Color     string    `json:"color"`
	LineWidth float64   `json:"lineWidth"`
	CreatedBy uuid.UUID `json:"createdBy"`
	CreatedAt time.Time `json:"createdAt"`
}

type Point struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

type BoardSettings struct {
	BackgroundColor string `json:"backgroundColor"`
}

type CreateBoardRequest struct {
	Name string `json:"name" binding:"required"`
}

type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type DrawPayload struct {
	Object DrawObject `json:"object"`
}

type DeletePayload struct {
	ObjectID string `json:"objectId"`
}

type ClearPayload struct {
}

type SyncRequestPayload struct {
}

type SyncResponsePayload struct {
	Objects []DrawObject `json:"objects"`
	Version int          `json:"version"`
}
