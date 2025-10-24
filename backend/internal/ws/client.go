package ws

import (
    "encoding/json"
    "log"
    "time"

    "github.com/google/uuid"
    "github.com/gorilla/websocket"
)

const (
    writeWait      = 10 * time.Second
    pongWait       = 60 * time.Second
    pingPeriod     = (pongWait * 9) / 10
    maxMessageSize = 512 * 1024 // 512KB
)

type Client struct {
    hub     *Hub
    conn    *websocket.Conn
    send    chan *Message
    boardID string
    userID  uuid.UUID
}

func NewClient(hub *Hub, conn *websocket.Conn, boardID string, userID uuid.UUID) *Client {
    return &Client{
        hub:     hub,
        conn:    conn,
        send:    make(chan *Message, 256),
        boardID: boardID,
        userID:  userID,
    }
}

func (c *Client) ReadPump() {
    defer func() {
        c.hub.unregister <- c
        c.conn.Close()
    }()

    c.conn.SetReadLimit(maxMessageSize)
    c.conn.SetReadDeadline(time.Now().Add(pongWait))
    c.conn.SetPongHandler(func(string) error {
        c.conn.SetReadDeadline(time.Now().Add(pongWait))
        return nil
    })

    for {
        _, message, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                log.Printf("WebSocket error: %v", err)
            }
            break
        }

        var msg Message
        if err := json.Unmarshal(message, &msg); err != nil {
            log.Printf("Failed to unmarshal message: %v", err)
            continue
        }

        msg.BoardID = c.boardID
        msg.UserID = c.userID

        c.hub.broadcast <- &msg
    }
}

func (c *Client) WritePump() {
    ticker := time.NewTicker(pingPeriod)
    defer func() {
        ticker.Stop()
        c.conn.Close()
    }()

    for {
        select {
        case message, ok := <-c.send:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            w, err := c.conn.NextWriter(websocket.TextMessage)
            if err != nil {
                return
            }

            data, err := json.Marshal(message)
            if err != nil {
                log.Printf("Failed to marshal message: %v", err)
                w.Close()
                continue
            }

            w.Write(data)

            n := len(c.send)
            for i := 0; i < n; i++ {
                w.Write([]byte{'\n'})
                msg := <-c.send
                data, err := json.Marshal(msg)
                if err != nil {
                    log.Printf("Failed to marshal queued message: %v", err)
                    continue
                }
                w.Write(data)
            }

            if err := w.Close(); err != nil {
                return
            }

        case <-ticker.C:
            c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
