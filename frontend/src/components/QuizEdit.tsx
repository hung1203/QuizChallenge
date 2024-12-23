import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../contexts/AuthContext';

interface Question {
  text: string;
  options: string[];
  correctAnswer: string;
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  questions: Question[];
}

const QuizEdit: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz>({
    title: '',
    description: '',
    questions: []
  });
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    options: ['', ''],
    correctAnswer: ''
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch quiz');
        }
        const data = await response.json();
        setQuiz(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load quiz');
      }
    };

    if (quizId) {
      fetchQuiz();
    }
  }, [quizId, token]);

  const handleQuizChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setQuiz(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleAddOption = () => {
    if (currentQuestion.options.length < 4) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const handleRemoveOption = (index: number) => {
    if (currentQuestion.options.length > 2) {
      setCurrentQuestion(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correctAnswer: prev.correctAnswer === prev.options[index] ? '' : prev.correctAnswer
      }));
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt.trim())) {
      setError('Please fill in all question fields');
      return;
    }

    if (!currentQuestion.correctAnswer) {
      setError('Please select a correct answer');
      return;
    }

    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, currentQuestion]
    }));

    setCurrentQuestion({
      text: '',
      options: ['', ''],
      correctAnswer: ''
    });
    setError(null);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quiz)
      });

      if (!response.ok) {
        throw new Error('Failed to update quiz');
      }

      navigate('/manage/quizzes');
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to save quiz');
    }
  };

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>Edit Quiz</Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Quiz Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={quiz.title}
              onChange={handleQuizChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={quiz.description}
              onChange={handleQuizChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Questions</Typography>
        <List>
          {quiz.questions.map((question, index) => (
            <ListItem key={index} divider>
              <ListItemText
                primary={question.text}
                secondary={`Options: ${question.options.join(', ')}`}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => handleRemoveQuestion(index)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Add New Question</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Question Text"
              name="text"
              value={currentQuestion.text}
              onChange={handleQuestionChange}
              required
            />
          </Grid>
          {currentQuestion.options.map((option, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Box display="flex" alignItems="center">
                <TextField
                  fullWidth
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
                {currentQuestion.options.length > 2 && (
                  <IconButton onClick={() => handleRemoveOption(index)}>
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Grid>
          ))}
          <Grid item xs={12}>
            {currentQuestion.options.length < 4 && (
              <Button onClick={handleAddOption}>
                Add Option
              </Button>
            )}
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Correct Answer</InputLabel>
              <Select
                value={currentQuestion.correctAnswer}
                label="Correct Answer"
                onChange={(e) => setCurrentQuestion(prev => ({
                  ...prev,
                  correctAnswer: e.target.value
                }))}
              >
                {currentQuestion.options.map((option, index) => (
                  <MenuItem key={index} value={option}>
                    {option || `Option ${index + 1}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddQuestion}
              disabled={!currentQuestion.text || currentQuestion.options.some(opt => !opt.trim())}
            >
              Add Question
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box display="flex" justifyContent="flex-end" gap={2}>
        <Button
          variant="outlined"
          onClick={() => navigate('/manage/quizzes')}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!quiz.title || quiz.questions.length === 0}
        >
          Save Quiz
        </Button>
      </Box>
    </Box>
  );
};

export default QuizEdit;
