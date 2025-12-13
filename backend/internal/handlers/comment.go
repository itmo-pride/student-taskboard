package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetComments(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		taskID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
			return
		}

		task, err := s.GetTaskByID(taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if task == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}

		isMember, err := s.IsProjectMember(task.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		comments, err := s.GetCommentsByTaskID(taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get comments"})
			return
		}

		c.JSON(http.StatusOK, comments)
	}
}

func CreateComment(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		taskID, err := uuid.Parse(c.Param("taskId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid task id"})
			return
		}

		task, err := s.GetTaskByID(taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if task == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "task not found"})
			return
		}

		isMember, err := s.IsProjectMember(task.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if !isMember {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		var req models.CreateCommentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		comment := &models.TaskComment{
			ID:        uuid.New(),
			TaskID:    taskID,
			UserID:    userID,
			Content:   req.Content,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		if err := s.CreateComment(comment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create comment"})
			return
		}

		user, _ := s.GetUserByID(userID)
		response := models.TaskCommentWithUser{
			ID:        comment.ID,
			TaskID:    comment.TaskID,
			UserID:    comment.UserID,
			Content:   comment.Content,
			CreatedAt: comment.CreatedAt,
			UpdatedAt: comment.UpdatedAt,
			UserName:  user.Name,
			UserEmail: user.Email,
		}

		c.JSON(http.StatusCreated, response)
	}
}

func UpdateComment(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		commentID, err := uuid.Parse(c.Param("commentId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
			return
		}

		comment, err := s.GetCommentByID(commentID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if comment == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
			return
		}

		if comment.UserID != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own comments"})
			return
		}

		var req models.UpdateCommentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		comment.Content = req.Content
		comment.UpdatedAt = time.Now()

		if err := s.UpdateComment(comment); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update comment"})
			return
		}

		c.JSON(http.StatusOK, comment)
	}
}

func DeleteComment(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		commentID, err := uuid.Parse(c.Param("commentId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid comment id"})
			return
		}

		comment, err := s.GetCommentByID(commentID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if comment == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "comment not found"})
			return
		}

		task, err := s.GetTaskByID(comment.TaskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		role, err := s.GetMemberRole(task.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}

		canDelete := comment.UserID == userID || role == "admin" || role == "owner"
		if !canDelete {
			c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own comments"})
			return
		}

		if err := s.DeleteComment(commentID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete comment"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "comment deleted"})
	}
}
