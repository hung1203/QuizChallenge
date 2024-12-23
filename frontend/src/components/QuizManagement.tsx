import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar,
  Alert,
  List,
  ListItem
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
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
  difficultyLevel: string;
  timePerQuestion: number;
  questions: Question[];
  isPublished: boolean;
}

const QuizManagement: React.FC = () => {
  const { token } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz>({
    title: '',
    description: '',
    difficultyLevel: 'beginner',
    timePerQuestion: 30,
    questions: [],
    isPublished: false
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    text: '',
    options: ['', ''],
    correctAnswer: ''
  });

  const difficultyLevels = ['beginner', 'intermediate', 'advanced'];

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:8084/api/quizzes', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setQuizzes(data);
      } else {
        throw new Error('Failed to fetch quizzes');
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      showSnackbar('Failed to fetch quizzes', 'error');
    }
  };

  const handleCreateQuiz = () => {
    setCurrentQuiz({
      title: '',
      description: '',
      difficultyLevel: 'beginner',
      timePerQuestion: 30,
      questions: [],
      isPublished: false
    });
    setOpenDialog(true);
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setOpenDialog(true);
  };

  const handleSaveQuiz = async () => {
    if (!currentQuiz) return;

    // Validate quiz
    if (!currentQuiz.title) {
      showSnackbar('Please enter a quiz title', 'error');
      return;
    }

    if (currentQuiz.questions.length === 0) {
      showSnackbar('Please add at least one question', 'error');
      return;
    }

    try {
      const url = currentQuiz.id
        ? `http://localhost:8084/api/quizzes/${currentQuiz.id}`
        : 'http://localhost:8084/api/quizzes';
      const method = currentQuiz.id ? 'PUT' : 'POST';

      const requestBody = {
        title: currentQuiz.title,
        description: currentQuiz.description,
        difficulty_level: currentQuiz.difficultyLevel.toLowerCase(),
        time_per_question: currentQuiz.timePerQuestion,
        questions: currentQuiz.questions.map(q => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer
        }))
      };

      console.log('Sending request body:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to save quiz' }));
        throw new Error(errorData.error || 'Failed to save quiz');
      }

      showSnackbar(`Quiz ${currentQuiz.id ? 'updated' : 'created'} successfully`, 'success');
      setOpenDialog(false);
      fetchQuizzes();
    } catch (error) {
      console.error('Error saving quiz:', error);
      showSnackbar(error instanceof Error ? error.message : 'Failed to save quiz', 'error');
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.text || currentQuestion.options.some(opt => !opt.trim())) {
      showSnackbar('Please fill in all question fields', 'error');
      return;
    }

    if (!currentQuestion.correctAnswer) {
      showSnackbar('Please select a correct answer', 'error');
      return;
    }

    const newQuestion = {
      text: currentQuestion.text,
      options: currentQuestion.options.filter(opt => opt.trim() !== ''),
      correctAnswer: currentQuestion.correctAnswer
    };

    setCurrentQuiz({
      ...currentQuiz,
      questions: [...currentQuiz.questions, newQuestion]
    });

    // Reset current question
    setCurrentQuestion({
      text: '',
      options: ['', ''],
      correctAnswer: ''
    });
  };




  const removeOption = (index: number) => {
    if (currentQuestion.options.length <= 2) {
      showSnackbar('Minimum 2 options required', 'error');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion(prev => ({
      ...prev,
      options: newOptions,
      correctAnswer: prev.correctAnswer === prev.options[index] ? '' : prev.correctAnswer
    }));
  };

  const handlePublishQuiz = async (quiz: Quiz) => {
    try {
      const response = await fetch(`http://localhost:8084/api/quizzes/${quiz.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showSnackbar('Quiz published successfully', 'success');
        fetchQuizzes();
      } else {
        throw new Error('Failed to publish quiz');
      }
    } catch (error) {
      console.error('Error publishing quiz:', error);
      showSnackbar('Failed to publish quiz', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Quiz Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleCreateQuiz}
          sx={{ mb: 3 }}
        >
          Create New Quiz
        </Button>

        <Grid container spacing={3}>
          {quizzes.map((quiz) => (
            <Grid item xs={12} sm={6} md={4} key={quiz.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {quiz.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {quiz.description}
                  </Typography>
                  <Typography variant="body2">
                    Difficulty: {quiz.difficultyLevel}
                  </Typography>
                  <Typography variant="body2">
                    Questions: {quiz.questions.length}
                  </Typography>
                  <Typography variant="body2">
                    Status: {quiz.isPublished ? 'Published' : 'Draft'}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton onClick={() => handleEditQuiz(quiz)}>
                    <EditIcon />
                  </IconButton>
                  {!quiz.isPublished && (
                    <Button
                      size="small"
                      color="primary"
                      onClick={() => handlePublishQuiz(quiz)}
                    >
                      Publish
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Quiz Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentQuiz.id ? 'Edit Quiz' : 'Create New Quiz'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Title"
              value={currentQuiz.title}
              onChange={(e) => setCurrentQuiz({ ...currentQuiz, title: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={currentQuiz.description}
              onChange={(e) => setCurrentQuiz({ ...currentQuiz, description: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel>Difficulty Level</InputLabel>
              <Select
                label="Difficulty Level"
                value={currentQuiz.difficultyLevel}
                onChange={(e) => setCurrentQuiz({ ...currentQuiz, difficultyLevel: e.target.value })}
              >
                {difficultyLevels.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Time per Question (seconds)"
              value={currentQuiz.timePerQuestion}
              onChange={(e) => setCurrentQuiz({ ...currentQuiz, timePerQuestion: parseInt(e.target.value) })}
              sx={{ mb: 2 }}
              inputProps={{ min: 10, max: 300 }}
            />

            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Questions
              </Typography>
              
              {/* Current question form */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                <TextField
                  fullWidth
                  label="Question Text"
                  value={currentQuestion.text}
                  onChange={(e) => setCurrentQuestion(prev => ({ ...prev, text: e.target.value }))}
                  sx={{ mb: 2 }}
                />
                
                {currentQuestion.options.map((option, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      label={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...currentQuestion.options];
                        newOptions[index] = e.target.value;
                        setCurrentQuestion(prev => ({
                          ...prev,
                          options: newOptions,
                          correctAnswer: prev.correctAnswer === prev.options[index] ? e.target.value : prev.correctAnswer
                        }));
                      }}
                    />
                    <IconButton 
                      onClick={() => removeOption(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                ))}
                
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => setCurrentQuestion(prev => ({
                    ...prev,
                    options: [...prev.options, '']
                  }))}
                  sx={{ mt: 1 }}
                >
                  Add Option
                </Button>

                <FormControl fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Correct Answer</InputLabel>
                  <Select
                    value={currentQuestion.correctAnswer}
                    onChange={(e) => setCurrentQuestion(prev => ({
                      ...prev,
                      correctAnswer: e.target.value
                    }))}
                    label="Correct Answer"
                  >
                    {currentQuestion.options.map((option, index) => (
                      option.trim() && (
                        <MenuItem key={index} value={option}>
                          {option}
                        </MenuItem>
                      )
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant="contained"
                  onClick={handleAddQuestion}
                  disabled={!currentQuestion.text || currentQuestion.options.some(opt => !opt.trim()) || !currentQuestion.correctAnswer}
                  sx={{ mt: 2 }}
                >
                  Add Question
                </Button>
              </Box>

              {/* List of added questions */}
              <List>
                {currentQuiz.questions.map((question, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Question {index + 1}: {question.text}
                    </Typography>
                    <Box sx={{ ml: 2 }}>
                      {question.options.map((option, optIndex) => (
                        <Typography 
                          key={optIndex}
                          color={option === question.correctAnswer ? 'success.main' : 'inherit'}
                        >
                          {optIndex + 1}. {option} {option === question.correctAnswer && '(Correct)'}
                        </Typography>
                      ))}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveQuiz} variant="contained" color="primary">
            Save Quiz
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default QuizManagement;
