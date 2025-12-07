package ws

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
)

type Hub struct {
	boards     map[string]map[*Client]bool
	register   chan *Client
	unregister chan *Client
	broadcast  chan *Message
	mu         sync.RWMutex
	store      *store.Store

	// Буфер для batch-сохранения
	saveQueue map[string][]models.DrawObject
	saveMu    sync.Mutex
}

type Message struct {
	BoardID string      `json:"board_id"`
	UserID  uuid.UUID   `json:"user_id"`
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

func NewHub(s *store.Store) *Hub {
	h := &Hub{
		boards:     make(map[string]map[*Client]bool),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		broadcast:  make(chan *Message, 256),
		store:      s,
		saveQueue:  make(map[string][]models.DrawObject),
	}

	// Запускаем периодическое сохранение
	go h.periodicSave()

	return h
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
			clientCount := len(h.boards[client.boardID])
			h.mu.Unlock()

			log.Printf("Client %s joined board %s (total: %d)", client.userID, client.boardID, clientCount)

			// Отправляем текущее состояние доски новому клиенту
			go h.sendBoardState(client)

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
			log.Printf("Client %s left board %s", client.userID, client.boardID)

		case message := <-h.broadcast:
			h.handleMessage(message)
		}
	}
}

// handleMessage обрабатывает входящие сообщения
func (h *Hub) handleMessage(message *Message) {
	switch message.Type {
	case "draw":
		// Сохраняем объект и рассылаем всем
		h.handleDraw(message)
	case "delete":
		h.handleDelete(message)
	case "clear":
		h.handleClear(message)
	case "sync_request":
		// Клиент запрашивает полное состояние
		// Ничего не делаем здесь, состояние отправляется при подключении
	default:
		// Просто рассылаем всем остальным
		h.broadcastToOthers(message)
	}
}

// handleDraw обрабатывает событие рисования
func (h *Hub) handleDraw(message *Message) {
	// Парсим объект
	payloadBytes, err := json.Marshal(message.Payload)
	if err != nil {
		log.Printf("Failed to marshal draw payload: %v", err)
		return
	}

	var payload struct {
		Object models.DrawObject `json:"object"`
	}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		log.Printf("Failed to unmarshal draw payload: %v", err)
		return
	}

	// Добавляем в очередь на сохранение
	h.saveMu.Lock()
	h.saveQueue[message.BoardID] = append(h.saveQueue[message.BoardID], payload.Object)
	h.saveMu.Unlock()

	// Рассылаем всем клиентам
	h.broadcastToAll(message)
}

// handleDelete обрабатывает удаление объекта
func (h *Hub) handleDelete(message *Message) {
	payloadBytes, err := json.Marshal(message.Payload)
	if err != nil {
		return
	}

	var payload struct {
		ObjectID string `json:"objectId"`
	}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return
	}

	boardUUID, err := uuid.Parse(message.BoardID)
	if err != nil {
		return
	}

	// Удаляем из БД
	if err := h.store.RemoveObjectFromBoard(boardUUID, payload.ObjectID); err != nil {
		log.Printf("Failed to remove object from board: %v", err)
	}

	// Рассылаем всем
	h.broadcastToAll(message)
}

// handleClear очищает доску
func (h *Hub) handleClear(message *Message) {
	boardUUID, err := uuid.Parse(message.BoardID)
	if err != nil {
		return
	}

	// Очищаем в БД
	if err := h.store.ClearBoard(boardUUID); err != nil {
		log.Printf("Failed to clear board: %v", err)
	}

	// Очищаем очередь сохранения
	h.saveMu.Lock()
	delete(h.saveQueue, message.BoardID)
	h.saveMu.Unlock()

	// Рассылаем всем
	h.broadcastToAll(message)
}

// broadcastToAll рассылает сообщение всем клиентам на доске
func (h *Hub) broadcastToAll(message *Message) {
	h.mu.RLock()
	clients, ok := h.boards[message.BoardID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	for client := range clients {
		select {
		case client.send <- message:
		default:
			close(client.send)
			h.mu.Lock()
			delete(clients, client)
			h.mu.Unlock()
		}
	}
}

// broadcastToOthers рассылает сообщение всем кроме отправителя
func (h *Hub) broadcastToOthers(message *Message) {
	h.mu.RLock()
	clients, ok := h.boards[message.BoardID]
	h.mu.RUnlock()

	if !ok {
		return
	}

	for client := range clients {
		if client.userID == message.UserID {
			continue
		}
		select {
		case client.send <- message:
		default:
			close(client.send)
			h.mu.Lock()
			delete(clients, client)
			h.mu.Unlock()
		}
	}
}

// sendBoardState отправляет текущее состояние доски клиенту
func (h *Hub) sendBoardState(client *Client) {
	boardUUID, err := uuid.Parse(client.boardID)
	if err != nil {
		return
	}

	board, err := h.store.GetBoardByID(boardUUID)
	if err != nil || board == nil {
		return
	}

	var boardData models.BoardData
	if err := json.Unmarshal(board.Data, &boardData); err != nil {
		log.Printf("Failed to unmarshal board data: %v", err)
		return
	}

	syncMsg := &Message{
		BoardID: client.boardID,
		UserID:  uuid.Nil,
		Type:    "sync",
		Payload: map[string]interface{}{
			"objects": boardData.Objects,
			"version": boardData.Version,
		},
	}

	select {
	case client.send <- syncMsg:
	default:
	}
}

// periodicSave периодически сохраняет объекты из очереди в БД
func (h *Hub) periodicSave() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		h.saveMu.Lock()
		queues := h.saveQueue
		h.saveQueue = make(map[string][]models.DrawObject)
		h.saveMu.Unlock()

		for boardID, objects := range queues {
			if len(objects) == 0 {
				continue
			}

			boardUUID, err := uuid.Parse(boardID)
			if err != nil {
				continue
			}

			for _, obj := range objects {
				if err := h.store.AddObjectToBoard(boardUUID, obj); err != nil {
					log.Printf("Failed to save object to board %s: %v", boardID, err)
				}
			}
		}
	}
}

// GetOnlineCount возвращает количество клиентов на доске
func (h *Hub) GetOnlineCount(boardID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.boards[boardID])
}
