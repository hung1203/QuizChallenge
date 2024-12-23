package main

import (
	"log"
	"quiz-service/config"
	"quiz-service/handlers"
	"quiz-service/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Connect to database
	config.ConnectDB()

	// Initialize router
	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           12 * 3600,
	}))

	// Routes
	api := router.Group("/api/quizzes")
	{
		// Public routes (no auth required)
		api.GET("", handlers.ListQuizzes)
		api.GET("/:id", handlers.GetQuiz)
		api.GET("/:id/leaderboard", handlers.GetLeaderboard)
	}

	// Protected routes (auth required)
	protected := router.Group("/api/quizzes")
	protected.Use(middleware.AuthMiddleware())
	{
		// Quiz Management
		protected.POST("", handlers.CreateQuiz)
		protected.PUT("/:id", handlers.UpdateQuiz)
		protected.POST("/:id/publish", handlers.PublishQuiz)
		
		// Quiz Participation
		protected.POST("/:id/submit/:questionIndex", handlers.SubmitAnswer)
		protected.POST("/:id/finish", handlers.FinishQuiz)
		protected.GET("/:id/results", handlers.GetQuizResults)
		protected.POST("/:id/leaderboard", handlers.UpdateLeaderboard)
	}

	// Start server
	if err := router.Run(":8084"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
