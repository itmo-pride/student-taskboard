package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetBoards(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		projectID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
			return
		}

		isMember, err := s.IsProjectMember(projectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		boards, err := s.GetBoardsByProject(projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get boards"})
			return
		}

		c.JSON(http.StatusOK, boards)
	}
}

func CreateBoard(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		projectID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
			return
		}

		isMember, err := s.IsProjectMember(projectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		var req models.CreateBoardRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		initialData, _ := json.Marshal(models.BoardData{
			Objects: []models.DrawObject{},
			Version: 0,
		})
		initialSettings, _ := json.Marshal(models.BoardSettings{
			BackgroundColor: "#ffffff",
		})

		board := &models.Board{
			ID:        uuid.New(),
			ProjectID: projectID,
			Name:      req.Name,
			Data:      initialData,
			Settings:  initialSettings,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := s.CreateBoard(board); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create board"})
			return
		}

		c.JSON(http.StatusCreated, board)
	}
}

func GetBoard(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		boardID, err := uuid.Parse(c.Param("boardId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board id"})
			return
		}

		board, err := s.GetBoardByID(boardID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if board == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
			return
		}

		isMember, err := s.IsProjectMember(board.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		c.JSON(http.StatusOK, board)
	}
}

func UpdateBoardName(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		boardID, err := uuid.Parse(c.Param("boardId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board id"})
			return
		}

		board, err := s.GetBoardByID(boardID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if board == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
			return
		}

		isMember, err := s.IsProjectMember(board.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		var req struct {
			Name string `json:"name" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		board.Name = req.Name
		if err := s.UpdateBoard(board); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update board"})
			return
		}

		c.JSON(http.StatusOK, board)
	}
}

func DeleteBoard(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		boardID, err := uuid.Parse(c.Param("boardId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board id"})
			return
		}

		board, err := s.GetBoardByID(boardID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if board == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
			return
		}

		role, err := s.GetMemberRole(board.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if role != "owner" && role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "only owner or admin can delete boards"})
			return
		}

		if err := s.DeleteBoard(boardID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete board"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "board deleted"})
	}
}

func ClearBoardHandler(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		boardID, err := uuid.Parse(c.Param("boardId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid board id"})
			return
		}

		board, err := s.GetBoardByID(boardID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if board == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "board not found"})
			return
		}

		isMember, err := s.IsProjectMember(board.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		if err := s.ClearBoard(boardID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to clear board"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "board cleared"})
	}
}
