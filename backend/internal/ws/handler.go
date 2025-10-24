package ws

import (
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        return true
    },
}

func ServeWS(hub *Hub) gin.HandlerFunc {
    return func(c *gin.Context) {
        boardID := c.Param("boardId")
        if boardID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "board id required"})
            return
        }

        userIDVal, exists := c.Get("user_id")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }
        userID := userIDVal.(uuid.UUID)

        conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
        if err != nil {
            log.Printf("Failed to upgrade connection: %v", err)
            return
        }

        client := NewClient(hub, conn, boardID, userID)
        hub.register <- client

        go client.WritePump()
        go client.ReadPump()
    }
}
