import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  text: string;
  options: string[];
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
}

interface QuizResult {
  userId: string;
  username: string;
  score: number;
  timeTaken: number;
  finishedAt: string;
  answers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

interface QuizResultsResponse {
  title: string;
  results: QuizResult[];
}

const QuizAttempt: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { token, userId, username } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [startTime] = useState(new Date());

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load quiz');
        }

        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load quiz');
      }
    };

    fetchQuiz();
  }, [quizId, token]);

  const handleAnswerSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) {
      return;
    }

    try {
      // Submit answer
      const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}/submit/${currentQuestionIndex}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          answer: selectedAnswer,
          questionIndex: currentQuestionIndex 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      // Move to next question or finish quiz
      if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer('');
      } else {
        // This is the last question, mark the quiz as finished
        const finishResponse = await fetch(`http://localhost:8084/api/quizzes/${quizId}/finish`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!finishResponse.ok) {
          throw new Error('Failed to finish quiz');
        }

        // Now get the results
        await handleFinish();
        setShowResult(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to submit answer');
    }
  };

  const handleFinish = async () => {
    try {
      // Get quiz results
      const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }
      const data: QuizResultsResponse = await response.json();
      const userResult = data.results[0];
      if (!userResult) {
        throw new Error('Could not find your quiz results');
      }
      setQuizResult(userResult);

      // Update leaderboard
      const leaderboardEntry = {
        userId: userId,
        username: username,
        score: userResult.score,
        timeTaken: userResult.timeTaken,
      };

      await fetch(`http://localhost:8084/api/quizzes/${quizId}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(leaderboardEntry),
      });

    } catch (error) {
      console.error('Error:', error);
      setError('Failed to finish quiz');
    }
  };

  const handleTryAgain = () => {
    navigate('/quizzes');
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (!quiz) {
    return <Typography>Loading quiz...</Typography>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>{quiz.title}</Typography>
      <Typography variant="h6" gutterBottom>
        Question {currentQuestionIndex + 1} of {quiz.questions.length}
      </Typography>

      <Box my={4}>
        <Typography variant="body1" gutterBottom>{currentQuestion.text}</Typography>
        <RadioGroup value={selectedAnswer} onChange={handleAnswerSelect}>
          {currentQuestion.options.map((option, index) => (
            <FormControlLabel
              key={index}
              value={option}
              control={<Radio />}
              label={option}
            />
          ))}
        </RadioGroup>
      </Box>

      <Button
        variant="contained"
        color="primary"
        onClick={handleNextQuestion}
        disabled={!selectedAnswer}
      >
        {currentQuestionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'}
      </Button>

      <Dialog open={showResult} onClose={handleTryAgain} maxWidth="sm" fullWidth>
        <DialogTitle>Quiz Results</DialogTitle>
        <DialogContent>
          {quizResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Score: {quizResult.score}%
              </Typography>
              <Typography gutterBottom>
                Correct Answers: {quizResult.answers.filter(answer => answer.userAnswer === answer.correctAnswer).length} out of {quizResult.answers.length}
              </Typography>
              {quizResult.answers.map((answer, index) => (
                <Box key={index} mb={2}>
                  <Typography variant="body1">{answer.question}</Typography>
                  <Typography color={answer.userAnswer === answer.correctAnswer ? 'success' : 'error'}>
                    Your Answer: {answer.userAnswer}
                  </Typography>
                  <Typography color="success">Correct Answer: {answer.correctAnswer}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => navigate(`/quizzes/${quizId}/leaderboard`)}>View Leaderboard</Button>
          <Button onClick={handleTryAgain}>Try Another Quiz</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizAttempt;
