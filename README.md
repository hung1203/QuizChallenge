# Real-Time Vocabulary Quiz Application

A microservices-based real-time vocabulary quiz application built with React and Go.

## Project Structure

```
QuizChallenge/
├── frontend/               # React frontend application
├── quiz-service/          # Go service for managing quizzes
├── user-service/         # Go service for user management
├── leaderboard-service/  # Go service for real-time leaderboard
└── websocket-service/    # Go service for WebSocket communications
```

## Services

### Frontend Service (React)
- User interface for quiz participation
- Real-time leaderboard display
- WebSocket client implementation

### Quiz Service (Go)
- Manages quiz sessions
- Handles question delivery
- Validates answers

### User Service (Go)
- User authentication
- Profile management
- Session handling

### Leaderboard Service (Go)
- Real-time score tracking
- Leaderboard calculations
- Ranking system

### WebSocket Service (Go)
- Real-time communication hub
- Manages WebSocket connections
- Broadcasts updates

## Technologies Used

- Frontend:
  - React
  - TypeScript
  - WebSocket client
  - Material-UI

- Backend:
  - Go
  - Gorilla WebSocket
  - MongoDB
  - Redis

## Setup Instructions

(Setup instructions will be added as each service is implemented)

## Development

### Prerequisites
- Node.js and npm
- Go 1.21+
- MongoDB
- Redis

### Running Locally
(Instructions for running services locally will be added)
