package ws

import (
    "log"
    "sync"

    "github.com/google/uuid"
)

type Hub struct {
    boards map[string]map[*Client]bool

    register chan *Client

    unregister chan *Client

    broadcast chan *Message

    mu sync.RWMutex
}

type Message struct {
    BoardID string      `json:"board_id"`
    UserID  uuid.UUID   `json:"user_id"`
    Type    string      `json:"type"`
    Payload interface{} `json:"payload"`
}

func NewHub() *Hub {
    return &Hub{
        boards:     make(map[string]map[*Client]bool),
        register:   make(chan *Client),
        unregister: make(chan *Client),
        broadcast:  make(chan *Message),
    }
}

func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            h.mu.Lock()
            if _, ok := h.boards[client.boardID]; !ok {
                h.boards[client.boardID] = make(map[*Client]bool)
            }
            h.boards[client.boardID][client] = true
            h.mu.Unlock()
            log.Printf("Client %s registered to board %s", client.userID, client.boardID)

        case client := <-h.unregister:
            h.mu.Lock()
            if clients, ok := h.boards[client.boardID]; ok {
                if _, ok := clients[client]; ok {
                    delete(clients, client)
                    close(client.send)
                    if len(clients) == 0 {
                        delete(h.boards, client.boardID)
                    }
                }
            }
            h.mu.Unlock()
            log.Printf("Client %s unregistered from board %s", client.userID, client.boardID)

        case message := <-h.broadcast:
            h.mu.RLock()
            if clients, ok := h.boards[message.BoardID]; ok {
                for client := range clients {
                    if client.userID != message.UserID {
                        select {
                        case client.send <- message:
                        default:
                            close(client.send)
                            delete(clients, client)
                        }
                    }
                }
            }
            h.mu.RUnlock()
        }
    }
}

func (h *Hub) BroadcastToBoard(boardID string, userID uuid.UUID, msgType string, payload interface{}) {
    message := &Message{
        BoardID: boardID,
        UserID:  userID,
        Type:    msgType,
        Payload: payload,
    }
    h.broadcast <- message
}
