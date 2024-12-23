import React from 'react';
import { Box, Button, Container, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="lg" sx={{ 
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          padding: { xs: 4, md: 8 },
          borderRadius: 4,
          backgroundColor: 'white',
          width: '100%',
          maxWidth: 800,
          textAlign: 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              fontSize: { xs: '2.5rem', md: '3.75rem' }
            }}
          >
            Quiz Challenge
          </Typography>
          <Typography 
            variant="h5" 
            component="h2" 
            gutterBottom
            sx={{ 
              color: 'text.secondary',
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1.2rem', md: '1.5rem' }
            }}
          >
            Test your vocabulary in real-time! Join a quiz room and compete with others.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate('/quizzes')}
            sx={{
              padding: '16px 48px',
              borderRadius: 3,
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              textTransform: 'none',
              boxShadow: 3,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Start Quiz
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Home;
