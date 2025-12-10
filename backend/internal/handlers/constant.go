package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/itmo-pride/student-taskboard/backend/internal/models"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetConstants(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		scope := c.Query("scope")
		projectIDStr := c.Query("project_id")

		var projectID *uuid.UUID
		if projectIDStr != "" {
			pid, err := uuid.Parse(projectIDStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "invalid project id"})
				return
			}
			projectID = &pid
		}

		constants, err := s.GetConstants(userID, projectID, scope)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get constants"})
			return
		}

		c.JSON(http.StatusOK, constants)
	}
}

func CreateConstant(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		var req models.CreateConstantRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		if req.Scope != "user" && req.Scope != "project" && req.Scope != "global" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid scope"})
			return
		}

		if req.Scope == "project" {
			if req.ScopeID == nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "scope_id required for project scope"})
				return
			}
			isMember, err := s.IsProjectMember(*req.ScopeID, userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			if !isMember {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
				return
			}
		}

		constant := &models.Constant{
			ID:          uuid.New(),
			Name:        req.Name,
			Symbol:      req.Symbol,
			Value:       req.Value,
			Unit:        req.Unit,
			Description: req.Description,
			Scope:       req.Scope,
			ScopeID:     req.ScopeID,
			CreatedBy:   userID,
			CreatedAt:   time.Now(),
			UpdatedAt:   time.Now(),
		}

		if err := s.CreateConstant(constant); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create constant"})
			return
		}

		c.JSON(http.StatusCreated, constant)
	}
}

func GetConstant(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		constantID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid constant id"})
			return
		}

		constant, err := s.GetConstantByID(constantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get constant"})
			return
		}
		if constant == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "constant not found"})
			return
		}

		if constant.Scope == "project" && constant.ScopeID != nil {
			isMember, err := s.IsProjectMember(*constant.ScopeID, userID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
				return
			}
			if !isMember {
				c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
				return
			}
		} else if constant.Scope == "user" && constant.CreatedBy != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
			return
		}

		c.JSON(http.StatusOK, constant)
	}
}

func UpdateConstant(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		constantID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid constant id"})
			return
		}

		constant, err := s.GetConstantByID(constantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if constant == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "constant not found"})
			return
		}

		if constant.CreatedBy != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "only creator can update constant"})
			return
		}

		var req models.CreateConstantRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		constant.Name = req.Name
		constant.Symbol = req.Symbol
		constant.Value = req.Value
		constant.Unit = req.Unit
		constant.Description = req.Description
		constant.UpdatedAt = time.Now()

		if err := s.UpdateConstant(constant); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update constant"})
			return
		}

		c.JSON(http.StatusOK, constant)
	}
}

func DeleteConstant(s *store.Store) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := getUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		constantID, err := uuid.Parse(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid constant id"})
			return
		}

		constant, err := s.GetConstantByID(constantID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if constant == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "constant not found"})
			return
		}

		isSystem, err := s.IsSystemUser(constant.CreatedBy)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
			return
		}
		if isSystem {
			c.JSON(http.StatusForbidden, gin.H{"error": "cannot delete system constants"})
			return
		}

		if constant.CreatedBy != userID {
			c.JSON(http.StatusForbidden, gin.H{"error": "only creator can delete constant"})
			return
		}

		if err := s.DeleteConstant(constantID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete constant"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "constant deleted"})
	}
}
