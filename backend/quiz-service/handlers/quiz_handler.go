package handlers

import (
	"context"
	"net/http"
	"quiz-service/config"
	"quiz-service/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var validate = validator.New()

func CreateQuiz(c *gin.Context) {
	var quiz models.Quiz
	if err := c.ShouldBindJSON(&quiz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate quiz
	if err := validate.Struct(quiz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set timestamps
	now := time.Now()
	quiz.CreatedAt = now
	quiz.UpdatedAt = now

	// Insert quiz
	result, err := config.DB.Collection("quizzes").InsertOne(context.Background(), quiz)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating quiz"})
		return
	}

	// Get the inserted ID
	quiz.ID = result.InsertedID.(primitive.ObjectID)

	c.JSON(http.StatusCreated, quiz)
}

func UpdateQuiz(c *gin.Context) {
	quizID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	var quiz models.Quiz
	if err := c.ShouldBindJSON(&quiz); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	quiz.UpdatedAt = time.Now()

	filter := bson.M{"_id": quizID}
	update := bson.M{"$set": quiz}

	result, err := config.DB.Collection("quizzes").UpdateOne(context.Background(), filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update quiz"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
		return
	}

	c.JSON(http.StatusOK, quiz)
}

func GetQuiz(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var quiz models.Quiz
	err = config.DB.Collection("quizzes").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&quiz)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz"})
		return
	}

	// Convert to response without correct answers
	response := models.QuizResponse{
		ID:          quiz.ID,
		Title:       quiz.Title,
		Description: quiz.Description,
		Questions:   make([]models.QuestionResponse, len(quiz.Questions)),
	}

	// Convert questions without including correct answers
	for i, q := range quiz.Questions {
		response.Questions[i] = models.QuestionResponse{
			Text:    q.Word,
			Options: q.Options,
		}
	}

	c.JSON(http.StatusOK, response)
}

func ListQuizzes(c *gin.Context) {
	cursor, err := config.DB.Collection("quizzes").Find(context.Background(), bson.M{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quizzes"})
		return
	}
	defer cursor.Close(context.Background())

	var quizzes []models.Quiz
	if err = cursor.All(context.Background(), &quizzes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing quizzes"})
		return
	}

	c.JSON(http.StatusOK, quizzes)
}

func PublishQuiz(c *gin.Context) {
	quizID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	filter := bson.M{"_id": quizID}
	update := bson.M{
		"$set": bson.M{
			"updated_at": time.Now(),
		},
	}

	result, err := config.DB.Collection("quizzes").UpdateOne(context.Background(), filter, update)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to publish quiz"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz published successfully"})
}

func SubmitAnswer(c *gin.Context) {
	quizID := c.Param("id")
	questionIndex := c.Param("questionIndex")

	var answer struct {
		Answer string `json:"answer" binding:"required"`
	}
	if err := c.ShouldBindJSON(&answer); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Convert quiz ID to ObjectID
	objectID, err := primitive.ObjectIDFromHex(quizID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	// Get the quiz
	var quiz models.Quiz
	err = config.DB.Collection("quizzes").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&quiz)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz"})
		return
	}

	// Parse question index
	qIndex, err := strconv.Atoi(questionIndex)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid question index"})
		return
	}

	if qIndex < 0 || qIndex >= len(quiz.Questions) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Question index out of range"})
		return
	}

	// Check if the answer is correct
	isCorrect := quiz.Questions[qIndex].CorrectAnswer == answer.Answer

	// Get user ID from token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	// Save the answer to the database
	filter := bson.M{
		"quiz_id": objectID,
		"user_id": userID,
	}
	update := bson.M{
		"$set": bson.M{
			"quiz_id":    objectID,
			"user_id":    userID,
			"created_at": time.Now(),
		},
		"$push": bson.M{
			"answers": models.UserAnswer{
				QuestionIndex: qIndex,
				Answer:       answer.Answer,
			},
		},
	}
	opts := options.Update().SetUpsert(true)

	_, err = config.DB.Collection("quiz_attempts").UpdateOne(context.Background(), filter, update, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving answer"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"correct": isCorrect,
	})
}

func GetQuizResults(c *gin.Context) {
	quizID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	// Get user ID from token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	// Get quiz details
	var quiz models.Quiz
	err = config.DB.Collection("quizzes").FindOne(context.Background(), bson.M{"_id": quizID}).Decode(&quiz)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz"})
		return
	}

	// Get user's attempt for this quiz
	var attempt models.QuizAttempt
	err = config.DB.Collection("quiz_attempts").FindOne(
		context.Background(),
		bson.M{
			"quiz_id": quizID,
			"user_id": userID,
		},
	).Decode(&attempt)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz attempt"})
		return
	}

	// Convert attempt to result format
	answers := make([]models.Answer, len(attempt.Answers))
	for j, ans := range attempt.Answers {
		answers[j] = models.Answer{
			Question:      quiz.Questions[ans.QuestionIndex].Word,
			UserAnswer:    ans.Answer,
			CorrectAnswer: quiz.Questions[ans.QuestionIndex].CorrectAnswer,
		}
	}

	result := models.QuizResult{
		UserID:     attempt.UserID,
		Username:   attempt.Username,
		Score:      attempt.Score,
		TimeTaken:  attempt.TimeTaken,
		FinishedAt: attempt.FinishedAt,
		Answers:    answers,
	}

	response := models.QuizResultsResponse{
		Title:   quiz.Title,
		Results: []models.QuizResult{result},
	}

	c.JSON(http.StatusOK, response)
}

func GetLeaderboard(c *gin.Context) {
	quizID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(quizID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	// Get quiz details
	var quiz models.Quiz
	err = config.DB.Collection("quizzes").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&quiz)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz"})
		return
	}

	// Get leaderboard entries
	opts := options.Find().SetSort(bson.D{{Key: "score", Value: -1}, {Key: "time_taken", Value: 1}})
	cursor, err := config.DB.Collection("leaderboard").Find(context.Background(), bson.M{"quiz_id": objectID}, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving leaderboard"})
		return
	}
	defer cursor.Close(context.Background())

	var entries []models.LeaderboardEntry
	if err = cursor.All(context.Background(), &entries); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error processing leaderboard entries"})
		return
	}

	response := models.LeaderboardResponse{
		QuizTitle: quiz.Title,
		Entries:   entries,
	}

	c.JSON(http.StatusOK, response)
}

func UpdateLeaderboard(c *gin.Context) {
	quizID := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(quizID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	var entry models.LeaderboardEntry
	if err := c.ShouldBindJSON(&entry); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	entry.QuizID = objectID
	entry.ID = primitive.NewObjectID()
	entry.FinishedAt = time.Now()

	_, err = config.DB.Collection("leaderboard").InsertOne(context.Background(), entry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating leaderboard"})
		return
	}

	c.JSON(http.StatusOK, entry)
}

func FinishQuiz(c *gin.Context) {
	quizID, err := primitive.ObjectIDFromHex(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid quiz ID"})
		return
	}

	// Get user ID from token
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in token"})
		return
	}

	// Get quiz attempt
	var attempt models.QuizAttempt
	err = config.DB.Collection("quiz_attempts").FindOne(
		context.Background(),
		bson.M{
			"quiz_id": quizID,
			"user_id": userID,
		},
	).Decode(&attempt)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Quiz attempt not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz attempt"})
		return
	}

	// Mark the attempt as finished
	now := time.Now()
	timeTaken := now.Sub(attempt.CreatedAt).Seconds()

	// Calculate score
	var quiz models.Quiz
	err = config.DB.Collection("quizzes").FindOne(context.Background(), bson.M{"_id": quizID}).Decode(&quiz)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving quiz"})
		return
	}

	correctAnswers := 0
	for _, ans := range attempt.Answers {
		if ans.Answer == quiz.Questions[ans.QuestionIndex].CorrectAnswer {
			correctAnswers++
		}
	}
	score := float64(correctAnswers) / float64(len(quiz.Questions)) * 100

	// Update the attempt
	update := bson.M{
		"$set": bson.M{
			"finished_at": now,
			"time_taken":  int64(timeTaken),
			"score":       score,
		},
	}

	_, err = config.DB.Collection("quiz_attempts").UpdateOne(
		context.Background(),
		bson.M{"_id": attempt.ID},
		update,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error updating quiz attempt"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Quiz finished successfully"})
}
