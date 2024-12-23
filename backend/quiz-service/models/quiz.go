package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Quiz struct {
	ID              primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Title           string            `bson:"title" json:"title" validate:"required"`
	Description     string            `bson:"description" json:"description"`
	Questions       []Question        `bson:"questions" json:"questions" validate:"required,dive"`
	CreatedAt       time.Time         `bson:"created_at" json:"created_at"`
	UpdatedAt       time.Time         `bson:"updated_at" json:"updated_at"`
}

type Question struct {
	Word          string   `bson:"word" json:"text" validate:"required"`
	Options       []string `bson:"options" json:"options" validate:"required,min=2"`
	CorrectAnswer string   `bson:"correct_answer" json:"correctAnswer" validate:"required"`
}

type QuizResponse struct {
	ID              primitive.ObjectID `json:"id"`
	Title           string            `json:"title"`
	Description     string            `json:"description"`
	TimePerQuestion int               `json:"time_per_question"`
	TotalQuestions  int               `json:"total_questions"`
	StartTime       *time.Time        `json:"start_time,omitempty"`
	EndTime         *time.Time        `json:"end_time,omitempty"`
	Questions       []QuestionResponse `json:"questions"`
}

type QuestionResponse struct {
	Text    string   `json:"text"`
	Options []string `json:"options"`
}

type Category struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string            `bson:"name" json:"name" validate:"required"`
	Description string            `bson:"description" json:"description"`
	CreatedAt   time.Time         `bson:"created_at" json:"created_at"`
	UpdatedAt   time.Time         `bson:"updated_at" json:"updated_at"`
}

type QuizResultResponse struct {
	TotalQuestions int              `json:"totalQuestions"`
	CorrectAnswers int              `json:"correctAnswers"`
	Score         float64           `json:"score"`
	Answers       []AnswerResponse  `json:"answers"`
}

type AnswerResponse struct {
	Question      string `json:"question"`
	UserAnswer    string `json:"userAnswer,omitempty"`
	CorrectAnswer string `json:"correctAnswer"`
}

type QuizAttempt struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	QuizID     primitive.ObjectID `bson:"quiz_id" json:"quiz_id"`
	UserID     string            `bson:"user_id" json:"user_id"`
	Username   string            `bson:"username" json:"username"`
	Score      float64           `bson:"score" json:"score"`
	TimeTaken  int64             `bson:"time_taken" json:"time_taken"`
	FinishedAt time.Time         `bson:"finished_at" json:"finished_at"`
	Answers    []UserAnswer      `bson:"answers" json:"answers"`
	CreatedAt  time.Time         `bson:"created_at" json:"created_at"`
}

type UserAnswer struct {
	QuestionIndex int    `bson:"question_index" json:"question_index"`
	Answer        string `bson:"answer" json:"answer"`
}

type LeaderboardEntry struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	QuizID     primitive.ObjectID `bson:"quiz_id" json:"quizId"`
	UserID     string            `bson:"user_id" json:"userId"`
	Username   string            `bson:"username" json:"username"`
	Score      float64           `bson:"score" json:"score"`
	TimeTaken  int64             `bson:"time_taken" json:"timeTaken"` // in seconds
	AttemptID  primitive.ObjectID `bson:"attempt_id" json:"attemptId"`
	FinishedAt time.Time         `bson:"finished_at" json:"finishedAt"`
}

type LeaderboardResponse struct {
	QuizTitle string             `json:"quizTitle"`
	Entries   []LeaderboardEntry `json:"entries"`
}

type QuizResult struct {
	UserID     string    `json:"userId"`
	Username   string    `json:"username"`
	Score      float64   `json:"score"`
	TimeTaken  int64     `json:"timeTaken"`
	FinishedAt time.Time `json:"finishedAt"`
	Answers    []Answer  `json:"answers"`
}

type Answer struct {
	Question      string `json:"question"`
	UserAnswer    string `json:"userAnswer,omitempty"`
	CorrectAnswer string `json:"correctAnswer"`
}

type QuizResultsResponse struct {
	Title   string       `json:"title"`
	Results []QuizResult `json:"results"`
}
