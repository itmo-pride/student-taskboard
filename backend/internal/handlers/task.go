package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
    "github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetTasks(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        projectID, err := uuid.Parse(c.Param("projectId"))
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

        tasks, err := s.GetTasksByProject(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get tasks"})
            return
        }

        c.JSON(http.StatusOK, tasks)
    }
}

func CreateTask(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        projectID, err := uuid.Parse(c.Param("projectId"))
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

        var req models.CreateTaskRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        
        if req.Status == "" {
            req.Status = "todo"
        }
        if req.Priority == "" {
            req.Priority = "medium"
        }

        task := &models.Task{
            ID:          uuid.New(),
            ProjectID:   projectID,
            Title:       req.Title,
            Description: req.Description,
            Status:      req.Status,
            Priority:    req.Priority,
            AssignedTo:  req.AssignedTo,
            CreatedBy:   userID,
            CreatedAt:   time.Now(),
            UpdatedAt:   time.Now(),
        }

        if err := s.CreateTask(task); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create task"})
            return
        }

        c.JSON(http.StatusCreated, task)
    }
}

func GetTask(s *store.Store) gin.HandlerFunc {
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
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get task"})
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

        c.JSON(http.StatusOK, task)
    }
}

func UpdateTask(s *store.Store) gin.HandlerFunc {
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

        var req models.UpdateTaskRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        if req.Title != "" {
            task.Title = req.Title
        }
        if req.Description != "" {
            task.Description = req.Description
        }
        if req.Status != "" {
            task.Status = req.Status
        }
        if req.Priority != "" {
            task.Priority = req.Priority
        }
        if req.AssignedTo != nil {
            task.AssignedTo = req.AssignedTo
        }
        task.UpdatedAt = time.Now()

        if err := s.UpdateTask(task); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update task"})
            return
        }

        c.JSON(http.StatusOK, task)
    }
}

func DeleteTask(s *store.Store) gin.HandlerFunc {
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

        if err := s.DeleteTask(taskID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete task"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "task deleted"})
    }
}
