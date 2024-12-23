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
  IconButton,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import { useAuth } from '../contexts/AuthContext';

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: any[];
  created_at: string;
}

const ManageQuizzes: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

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
      console.error('Error fetching quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    navigate('/manage/quizzes/create');
  };

  const handleEditQuiz = (quizId: string) => {
    navigate(`/manage/quizzes/${quizId}/edit`);
  };

  const handleViewLeaderboard = (quizId: string) => {
    navigate(`/quizzes/${quizId}/leaderboard`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Quiz Management</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateQuiz}
        >
          Create New Quiz
        </Button>
      </Box>

      <Grid container spacing={3}>
        {quizzes.map((quiz) => (
          <Grid item xs={12} sm={6} md={4} key={quiz.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {quiz.title}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Questions: {quiz.questions.length}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Created: {quiz.created_at ? new Date(quiz.created_at).toLocaleString() : 'N/A'}
                </Typography>
              </CardContent>
              <CardActions>
                <IconButton 
                  size="small" 
                  onClick={() => handleEditQuiz(quiz.id)}
                  title="Edit Quiz"
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small"
                  onClick={() => handleViewLeaderboard(quiz.id)}
                  title="View Leaderboard"
                >
                  <LeaderboardIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ManageQuizzes;
