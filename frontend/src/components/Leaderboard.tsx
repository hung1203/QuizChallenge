import React, { useEffect, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  CircularProgress,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  score: number;
  timeTaken: number;
  finishedAt: string;
}

interface LeaderboardData {
  quizTitle: string;
  entries: LeaderboardEntry[];
}

const Leaderboard: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const { token } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch(`http://localhost:8084/api/quizzes/${quizId}/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        const data = await response.json();
        console.log('Leaderboard data:', data); // Debug log
        setLeaderboardData(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err); // Debug log
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchLeaderboard();
      // Poll for updates every 10 seconds
      const interval = setInterval(fetchLeaderboard, 10000);
      return () => clearInterval(interval);
    }
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

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    return (
      <Box p={3}>
        <Typography>No entries yet</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        {leaderboardData.quizTitle} - Leaderboard
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rank</TableCell>
              <TableCell>Username</TableCell>
              <TableCell align="right">Score</TableCell>
              <TableCell align="right">Time Taken</TableCell>
              <TableCell>Finished At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaderboardData.entries.map((entry, index) => (
              <TableRow
                key={entry.id}
                sx={{ backgroundColor: index < 3 ? 'rgba(255, 215, 0, 0.1)' : 'inherit' }}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>{entry.username || 'Anonymous'}</TableCell>
                <TableCell align="right">{entry.score.toFixed(1)}%</TableCell>
                <TableCell align="right">{Math.floor(entry.timeTaken / 60)}m {entry.timeTaken % 60}s</TableCell>
                <TableCell>{new Date(entry.finishedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Leaderboard;
