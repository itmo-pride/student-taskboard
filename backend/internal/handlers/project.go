package handlers

import (
    "net/http"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/itmo-pride/student-taskboard/backend/internal/models"
    "github.com/itmo-pride/student-taskboard/backend/internal/store"
)

func GetProjects(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        projects, err := s.GetProjectsByUser(userID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get projects"})
            return
        }

        c.JSON(http.StatusOK, projects)
    }
}

func CreateProject(s *store.Store) gin.HandlerFunc {
    return func(c *gin.Context) {
        userID, err := getUserID(c)
        if err != nil {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            return
        }

        var req models.CreateProjectRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        project := &models.Project{
            ID:          uuid.New(),
            Name:        req.Name,
            Description: req.Description,
            OwnerID:     userID,
            CreatedAt:   time.Now(),
            UpdatedAt:   time.Now(),
        }

        if err := s.CreateProject(project); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create project"})
            return
        }

        c.JSON(http.StatusCreated, project)
    }
}

func GetProject(s *store.Store) gin.HandlerFunc {
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

        project, err := s.GetProjectByID(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get project"})
            return
        }
        if project == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
            return
        }

        c.JSON(http.StatusOK, project)
    }
}

func UpdateProject(s *store.Store) gin.HandlerFunc {
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

        project, err := s.GetProjectByID(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if project == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
            return
        }

        if project.OwnerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only owner can update project"})
            return
        }

        var req models.UpdateProjectRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        if req.Name != "" {
            project.Name = req.Name
        }
        if req.Description != "" {
            project.Description = req.Description
        }
        project.UpdatedAt = time.Now()

        if err := s.UpdateProject(project); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update project"})
            return
        }

        c.JSON(http.StatusOK, project)
    }
}

func DeleteProject(s *store.Store) gin.HandlerFunc {
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

        project, err := s.GetProjectByID(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if project == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
            return
        }

        if project.OwnerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only owner can delete project"})
            return
        }

        if err := s.DeleteProject(projectID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete project"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "project deleted"})
    }
}

func AddProjectMember(s *store.Store) gin.HandlerFunc {
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

        project, err := s.GetProjectByID(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if project == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
            return
        }

        if project.OwnerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only owner can add members"})
            return
        }

        var req struct {
            UserID string `json:"user_id" binding:"required"`
        }
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

        memberUserID, err := uuid.Parse(req.UserID)
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
            return
        }

        member := &models.ProjectMember{
            ID:        uuid.New(),
            ProjectID: projectID,
            UserID:    memberUserID,
            Role:      "member",
            JoinedAt:  time.Now(),
        }

        if err := s.AddProjectMember(member); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add member"})
            return
        }

        c.JSON(http.StatusCreated, member)
    }
}

func RemoveProjectMember(s *store.Store) gin.HandlerFunc {
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

        memberUserID, err := uuid.Parse(c.Param("userId"))
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
            return
        }

        project, err := s.GetProjectByID(projectID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
            return
        }
        if project == nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "project not found"})
            return
        }

        if project.OwnerID != userID {
            c.JSON(http.StatusForbidden, gin.H{"error": "only owner can remove members"})
            return
        }

        if err := s.RemoveProjectMember(projectID, memberUserID); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to remove member"})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "member removed"})
    }
}
