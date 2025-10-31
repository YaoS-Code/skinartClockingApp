import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { isValid } from 'date-fns';

function ClockInOut() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [breakMinutes, setBreakMinutes] = useState(30);
  
  // SkinartMD诊所专用 - 固定location
  const location = 'SkinartMD';

  useEffect(() => {
    checkClockStatus();
  }, []);

  const checkClockStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/clock/status');
      
      if (response.data.clockedIn && response.data.record) {
        const record = response.data.record;
        setIsClockedIn(true);
        setCurrentRecord(record);
        setNotes(record.notes || '');
        setBreakMinutes(record.break_minutes != null ? record.break_minutes : 30);
        
        // Format the clock-in time for display
        // API returns clock_in in format "YYYY-MM-DD HH:mm:ss"
        const clockInStr = record.clock_in;
        if (clockInStr) {
          try {
            // Parse MySQL datetime format "YYYY-MM-DD HH:mm:ss"
            // Convert to ISO format for proper Date parsing
            const isoStr = clockInStr.replace(' ', 'T');
            const clockInTime = new Date(isoStr);
            
            if (isValid(clockInTime)) {
              setMessage(`Clocked in since: ${format(clockInTime, 'yyyy-MM-dd HH:mm:ss')}`);
            } else {
              // Fallback: try direct parsing
              const fallbackTime = new Date(clockInStr);
              if (isValid(fallbackTime)) {
                setMessage(`Clocked in since: ${format(fallbackTime, 'yyyy-MM-dd HH:mm:ss')}`);
              } else {
                setMessage(`Clocked in since: ${clockInStr}`);
              }
            }
          } catch (e) {
            // If all parsing fails, just show the raw string
            setMessage(`Clocked in since: ${clockInStr}`);
          }
        } else {
          setMessage('Currently clocked in');
        }
      } else {
        setIsClockedIn(false);
        setCurrentRecord(null);
        setNotes('');
        setMessage('');
        setBreakMinutes(30);
      }
    } catch (err) {
      console.error('Failed to fetch clock status', err);
      setMessage('Failed to fetch clock status');
      setIsClockedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const response = await api.post('/clock/in', {
        notes
      });

      setMessage(response.data.message);
      await checkClockStatus();
    } catch (err) {
      setMessage(err.response?.data?.error || 'Clock in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);

      // Log the request data for debugging
      console.log('Clock out request data:', {
        notes,
        break_minutes: parseInt(breakMinutes)
      });

      const response = await api.post('/clock/out', {
        notes,
        break_minutes: parseInt(breakMinutes)
      });

      setMessage(response.data.message);
      setNotes('');
      setBreakMinutes(30);

      await checkClockStatus();

      // Redirect to records page after successful clock out
      navigate('/records');
    } catch (err) {
      console.error('Clock out error:', err.response?.data || err);
      setMessage(err.response?.data?.error || 'Clock out failed');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          {isClockedIn ? 'Currently Clocked In' : 'Clock In'}
        </Typography>

        {message && (
          <Typography
            color={message.includes('failed') ? 'error' : 'primary'}
            align="center"
            gutterBottom
          >
            {message}
          </Typography>
        )}

        {isClockedIn && currentRecord && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Clocked in since: {currentRecord.clock_in ? format(new Date(currentRecord.clock_in), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
            </Typography>
            <Typography variant="subtitle1">
              Location: {currentRecord.location || 'SkinartMD'}
            </Typography>
          </Box>
        )}

        <Box sx={{ mt: 2 }}>

          <TextField
            fullWidth
            label="Notes"
            multiline
            rows={4}
            margin="normal"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {isClockedIn && (
            <TextField
              fullWidth
              label="Break Minutes"
              type="number"
              margin="normal"
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0 }}
              helperText="Default break time is 30 minutes"
            />
          )}

          {isClockedIn ? (
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleClockOut}
              disabled={loading}
            >
              Clock Out
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleClockIn}
              disabled={loading}
            >
              Clock In
            </Button>
          )}

          {isClockedIn && (
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 1 }}
              onClick={() => navigate('/records')}
            >
              View Records
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}

export default ClockInOut;