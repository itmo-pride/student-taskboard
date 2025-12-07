package main

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/itmo-pride/student-taskboard/backend/internal/config"
	"github.com/itmo-pride/student-taskboard/backend/internal/db"
	"github.com/itmo-pride/student-taskboard/backend/internal/handlers"
	"github.com/itmo-pride/student-taskboard/backend/internal/store"
	"github.com/itmo-pride/student-taskboard/backend/internal/ws"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	log.Printf("Connecting to database: host=%s port=%s dbname=%s",
		cfg.DBHost, cfg.DBPort, cfg.DBName)

	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.Close()

	log.Printf("Database connected successfully")

	if err := database.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	str := store.NewStore(database)

	hub := ws.NewHub()
	go hub.Run()

	router := setupRouter(cfg, str, hub)

	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("Server starting on %s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func setupRouter(cfg *config.Config, str *store.Store, hub *ws.Hub) *gin.Engine {
	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/signup", handlers.SignUp(str, cfg))
			auth.POST("/login", handlers.Login(str, cfg))
		}

		protected := api.Group("")
		protected.Use(handlers.AuthMiddleware(cfg))
		{
			protected.GET("/me", handlers.GetMe(str))

			protected.GET("/projects", handlers.GetProjects(str))
			protected.POST("/projects", handlers.CreateProject(str))
			protected.GET("/projects/:id", handlers.GetProject(str))
			protected.PUT("/projects/:id", handlers.UpdateProject(str))
			protected.DELETE("/projects/:id", handlers.DeleteProject(str))
			protected.GET("/projects/:id/members", handlers.GetProjectMembers(str))
			protected.POST("/projects/:id/members", handlers.AddProjectMember(str))
			protected.DELETE("/projects/:id/members/:userId", handlers.RemoveProjectMember(str))

			protected.GET("/users/search", handlers.SearchUsers(str))

			protected.GET("/projects/:id/tasks", handlers.GetTasks(str))
			protected.POST("/projects/:id/tasks", handlers.CreateTask(str))
			protected.GET("/tasks/:id", handlers.GetTask(str))
			protected.PUT("/tasks/:id", handlers.UpdateTask(str))
			protected.DELETE("/tasks/:id", handlers.DeleteTask(str))

			protected.GET("/constants", handlers.GetConstants(str))
			protected.POST("/constants", handlers.CreateConstant(str))
			protected.GET("/constants/:id", handlers.GetConstant(str))
			protected.PUT("/constants/:id", handlers.UpdateConstant(str))
			protected.DELETE("/constants/:id", handlers.DeleteConstant(str))

			protected.GET("/formulas", handlers.GetFormulas(str))
			protected.POST("/formulas", handlers.CreateFormula(str))
			protected.GET("/formulas/:id", handlers.GetFormula(str))
			protected.PUT("/formulas/:id", handlers.UpdateFormula(str))
			protected.DELETE("/formulas/:id", handlers.DeleteFormula(str))

			protected.POST("/attachments", handlers.UploadAttachment(str, cfg))
			protected.GET("/attachments/:id", handlers.GetAttachment(str))
			protected.DELETE("/attachments/:id", handlers.DeleteAttachment(str, cfg))
		}

	}

	r.GET("/ws/boards/:boardId", handlers.AuthMiddlewareWS(cfg), handlers.ServeWS(hub))

	r.Static("/uploads", cfg.UploadPath)

	return r
}
