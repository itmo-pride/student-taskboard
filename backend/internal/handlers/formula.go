package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
    "github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetFormulas(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

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

        formulas, err := s.GetFormulas(userID, projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get formulas"})
            return
        }

        c.JSON(http.StatusOK, formulas)
    }
}

func CreateFormula(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        var req models.CreateFormulaRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        
        if req.ProjectID != nil {
            isMember, err := s.IsProjectMember(*req.ProjectID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        }

        formula := &models.Formula{
            ID:          uuid.New(),
            Title:       req.Title,
            Latex:       req.Latex,
            Description: req.Description,
            ProjectID:   req.ProjectID,
            CreatedBy:   userID,
            CreatedAt:   time.Now(),
            UpdatedAt:   time.Now(),
        }

        if err := s.CreateFormula(formula); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create formula"})
            return
        }

        c.JSON(http.StatusCreated, formula)
    }
}

func GetFormula(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        formulaID, err := uuid.Parse(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid formula id"})
            return
        }

        formula, err := s.GetFormulaByID(formulaID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get formula"})
            return
        }
        if formula == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "formula not found"})
            return
        }

        
        if formula.ProjectID != nil {
            isMember, err := s.IsProjectMember(*formula.ProjectID, userID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
                return
            }
            if !isMember {
                c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
                return
            }
        } else if formula.CreatedBy != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
            return
        }

        c.JSON(http.StatusOK, formula)
    }
}

func UpdateFormula(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        formulaID, err := uuid.Parse(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid formula id"})
            return
        }

        formula, err := s.GetFormulaByID(formulaID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if formula == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "formula not found"})
            return
        }

        
        if formula.CreatedBy != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only creator can update formula"})
            return
        }

        var req models.CreateFormulaRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        formula.Title = req.Title
        formula.Latex = req.Latex
        formula.Description = req.Description
        formula.UpdatedAt = time.Now()

        if err := s.UpdateFormula(formula); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update formula"})
            return
        }

        c.JSON(http.StatusOK, formula)
    }
}

func DeleteFormula(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        formulaID, err := uuid.Parse(c.Param("id"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid formula id"})
            return
        }

        formula, err := s.GetFormulaByID(formulaID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if formula == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "formula not found"})
            return
        }

        
        if formula.CreatedBy != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only creator can delete formula"})
            return
        }

        if err := s.DeleteFormula(formulaID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete formula"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "formula deleted"})
    }
}
