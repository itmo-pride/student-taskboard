package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetTags(s *store.Store) gin.HandlerFunc {
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

		tags, err := s.GetTagsByProject(projectID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tags"})
			return
		}

		c.JSON(http.StatusOK, tags)
	}
}

func CreateTag(s *store.Store) gin.HandlerFunc {
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

		var req models.CreateTagRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if !isValidHexColor(req.Color) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid color format, use #RRGGBB"})
			return
		}

		tag := &models.Tag{
			ID:        uuid.New(),
			ProjectID: projectID,
			Name:      strings.TrimSpace(req.Name),
			Color:     req.Color,
			CreatedBy: userID,
			CreatedAt: time.Now(),
		}

		if err := s.CreateTag(tag); err != nil {
			if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
				c.JSON(http.StatusConflict, gin.H{"error": "tag with this name already exists"})
				return
			}
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create tag"})
			return
		}

		c.JSON(http.StatusCreated, tag)
	}
}

func UpdateTag(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		tagID, err := uuid.Parse(c.Param("tagId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
			return
		}

		tag, err := s.GetTagByID(tagID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if tag == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
			return
		}

		role, err := s.GetMemberRole(tag.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if role != "owner" && role != "admin" && tag.CreatedBy != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "only tag creator, admin or owner can update tags"})
			return
		}

		var req models.UpdateTagRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Name != "" {
			tag.Name = strings.TrimSpace(req.Name)
		}
		if req.Color != "" {
			if !isValidHexColor(req.Color) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid color format"})
				return
			}
			tag.Color = req.Color
		}

		if err := s.UpdateTag(tag); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update tag"})
			return
		}

		c.JSON(http.StatusOK, tag)
	}
}

func DeleteTag(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		tagID, err := uuid.Parse(c.Param("tagId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
			return
		}

		tag, err := s.GetTagByID(tagID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if tag == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
			return
		}

		role, err := s.GetMemberRole(tag.ProjectID, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if role != "owner" && role != "admin" && tag.CreatedBy != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "only tag creator, admin or owner can delete tags"})
			return
		}

		if err := s.DeleteTag(tagID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete tag"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "tag deleted"})
	}
}

func GetTaskTags(s *store.Store) gin.HandlerFunc {
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

		tags, err := s.GetTagsByTask(taskID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tags"})
			return
		}

		c.JSON(http.StatusOK, tags)
	}
}

func AddTagToTask(s *store.Store) gin.HandlerFunc {
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

		var req models.AddTagToTaskRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		tagID, err := uuid.Parse(req.TagID)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
			return
		}

		tag, err := s.GetTagByID(tagID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if tag == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "tag not found"})
			return
		}
		if tag.ProjectID != task.ProjectID {
			c.JSON(http.StatusBadRequest, gin.H{"error": "tag does not belong to this project"})
			return
		}

		if err := s.AddTagToTask(taskID, tagID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add tag to task"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "tag added to task"})
	}
}

func RemoveTagFromTask(s *store.Store) gin.HandlerFunc {
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

		tagID, err := uuid.Parse(c.Param("tagId"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tag id"})
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

		if err := s.RemoveTagFromTask(taskID, tagID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove tag from task"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "tag removed from task"})
	}
}

func isValidHexColor(color string) bool {
	if len(color) != 7 || color[0] != '#' {
		return false
	}
	for _, c := range color[1:] {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	return true
}
