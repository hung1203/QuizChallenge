import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Button, Card, Container, Typography, Box, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';

interface Question {
  id: string;
  text: string;
  options: string[];
}

interface QuizState {
  currentQuestion: Question | null;
  participants: string[];
  results: any[];
  isStarted: boolean;
  isFinished: boolean;
}

const Quiz: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { connect, disconnect, sendMessage, lastMessage, isConnected } = useWebSocket();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: null,
    participants: [],
    results: [],
    isStarted: false,
    isFinished: false
  });

  useEffect(() => {
    if (quizId) {
      connect(quizId);
    }
    return () => disconnect();
  }, [quizId]);

  useEffect(() => {
    if (lastMessage) {
      handleWebSocketMessage(lastMessage);
    }
  }, [lastMessage]);

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case 'join':
        setQuizState(prev => ({
          ...prev,
          participants: [...prev.participants, message.content.user_id]
        }));
        break;
      case 'leave':
        setQuizState(prev => ({
          ...prev,
          participants: prev.participants.filter(id => id !== message.content.user_id)
        }));
        break;
      case 'question':
        setQuizState(prev => ({
          ...prev,
          currentQuestion: message.content,
          isStarted: true
        }));
        setSelectedAnswer('');
        break;
      case 'result':
        setQuizState(prev => ({
          ...prev,
          results: [...prev.results, message.content],
          isFinished: message.content.final || false
        }));
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer && quizState.currentQuestion) {
      sendMessage('answer', {
        question_id: quizState.currentQuestion.id,
        answer: selectedAnswer
      });
    }
  };

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAnswer(event.target.value);
  };

  if (!isConnected) {
    return (
      <Container>
        <Typography variant="h6">Connecting to quiz...</Typography>
      </Container>
    );
  }

  if (!quizState.isStarted) {
    return (
      <Container>
        <Typography variant="h6">Waiting for quiz to start...</Typography>
        <Typography variant="body1">
          Participants: {quizState.participants.length}
        </Typography>
      </Container>
    );
  }

  if (quizState.isFinished) {
    return (
      <Container>
        <Typography variant="h6">Quiz Finished!</Typography>
        <Box mt={3}>
          <Typography variant="h6">Results:</Typography>
          {quizState.results.map((result, index) => (
            <Card key={index} sx={{ mt: 2, p: 2 }}>
              <Typography>Score: {result.score}</Typography>
              <Typography>Time: {result.time}s</Typography>
            </Card>
          ))}
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      {quizState.currentQuestion && (
        <Box mt={3}>
          <Typography variant="h6">{quizState.currentQuestion.text}</Typography>
          <FormControl component="fieldset" sx={{ mt: 2 }}>
            <RadioGroup value={selectedAnswer} onChange={handleAnswerChange}>
              {quizState.currentQuestion.options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option}
                  control={<Radio />}
                  label={option}
                />
              ))}
            </RadioGroup>
          </FormControl>
          <Button
            variant="contained"
            color="primary"
            onClick={handleAnswerSubmit}
            disabled={!selectedAnswer}
            sx={{ mt: 2 }}
          >
            Submit Answer
          </Button>
        </Box>
      )}
      <Box mt={3}>
        <Typography variant="body2">
          Connected Players: {quizState.participants.length}
        </Typography>
      </Box>
    </Container>
  );
};

export default Quiz;
