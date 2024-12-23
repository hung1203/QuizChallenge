import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import theme from './theme';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Login from './components/Login';
import Register from './components/Register';
import NavBar from './components/NavBar';
import ManageQuizzes from './components/ManageQuizzes';
import PrivateRoute from './components/PrivateRoute';
import QuizAttempt from './components/QuizAttempt';
import QuizList from './components/QuizList';
import Leaderboard from './components/Leaderboard';
import QuizResults from './components/QuizResults';
import QuizEdit from './components/QuizEdit';
import { Box } from '@mui/material';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <Box sx={{ 
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: '#f5f5f5'
            }}>
              <NavBar />
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                py: 4
              }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/quiz/:quizId" element={<Quiz />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/manage/quizzes" element={
                    <PrivateRoute>
                      <ManageQuizzes />
                    </PrivateRoute>
                  } />
                  <Route path="/manage/quizzes/:quizId/edit" element={
                    <PrivateRoute>
                      <QuizEdit />
                    </PrivateRoute>
                  } />
                  <Route path="/quizzes" element={
                    <PrivateRoute>
                      <QuizList />
                    </PrivateRoute>
                  } />
                  <Route path="/quizzes/:quizId/attempt" element={
                    <PrivateRoute>
                      <QuizAttempt />
                    </PrivateRoute>
                  } />
                  <Route path="/quizzes/:quizId/leaderboard" element={
                    <PrivateRoute>
                      <Leaderboard />
                    </PrivateRoute>
                  } />
                  <Route path="/quizzes/:quizId/results" element={
                    <PrivateRoute>
                      <QuizResults />
                    </PrivateRoute>
                  } />
                </Routes>
              </Box>
            </Box>
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
