import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  created_at: string;
  updated_at: string;
}

const QuizList: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await fetch('http://localhost:8084/api/quizzes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch quizzes');
        }
        const data = await response.json();
        setQuizzes(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [token]);

  const handleTakeQuiz = (quizId: string) => {
    // Ensure we're using the string representation of the ObjectID
    const id = quizId.toString();
    navigate(`/quizzes/${id}/attempt`);
  };

  const handleViewLeaderboard = (quizId: string) => {
    // Ensure we're using the string representation of the ObjectID
    const id = quizId.toString();
    navigate(`/quizzes/${id}/leaderboard`);
  };

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

  if (quizzes.length === 0) {
    return (
      <Box p={3}>
        <Typography>No quizzes available</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Available Quizzes
      </Typography>
      <Grid container spacing={3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.id}>
            <Card>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  {quiz.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {quiz.description}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Questions: {quiz.questions.length}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Created: {new Date(quiz.created_at).toLocaleString()}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  variant="contained" 
                  onClick={() => handleTakeQuiz(quiz.id)}
                >
                  Take Quiz
                </Button>
                <Button 
                  size="small"
                  variant="outlined"
                  onClick={() => handleViewLeaderboard(quiz.id)}
                >
                  View Leaderboard
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default QuizList;
