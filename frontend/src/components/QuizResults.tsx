import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

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

interface QuizDetails {
  title: string;
  results: QuizResult[];
}

const QuizResults: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { token } = useAuth();
  const [quizDetails, setQuizDetails] = useState<QuizDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}/results`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        setQuizDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [quizId, token]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!quizDetails || quizDetails.results.length === 0) {
    return (
      <Box p={3}>
        <Typography>No results available for this quiz</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {quizDetails.title} - Results
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Time Taken</TableCell>
              <TableCell>Completed At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizDetails.results.map((result, index) => (
              <TableRow key={index}>
                <TableCell>{result.username}</TableCell>
                <TableCell align="right">{result.score.toFixed(1)}%</TableCell>
                <TableCell align="right">
                  {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
                </TableCell>
                <TableCell>{new Date(result.finishedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        Detailed Results
      </Typography>

      {quizDetails.results.map((result, index) => (
        <Box key={index} mb={4}>
          <Typography variant="h6" gutterBottom>
            {result.username}'s Answers
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Question</TableCell>
                  <TableCell>User Answer</TableCell>
                  <TableCell>Correct Answer</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.answers.map((answer, ansIndex) => (
                  <TableRow key={ansIndex}>
                    <TableCell>{answer.question}</TableCell>
                    <TableCell>{answer.userAnswer}</TableCell>
                    <TableCell>{answer.correctAnswer}</TableCell>
                    <TableCell>
                      <Typography
                        color={answer.userAnswer === answer.correctAnswer ? 'success.main' : 'error.main'}
                      >
                        {answer.userAnswer === answer.correctAnswer ? 'Correct' : 'Incorrect'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
};

export default QuizResults;
