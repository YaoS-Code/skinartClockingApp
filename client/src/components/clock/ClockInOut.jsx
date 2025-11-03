import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { format } from 'date-fns';
import { isValid } from 'date-fns';

function ClockInOut() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [locationError, setLocationError] = useState('');
  const [locationStatus, setLocationStatus] = useState('checking'); // checking, allowed, denied
  
  // SkinartMD 诊所位置
  // 地址: 4378 Beresford St. #101, Burnaby, BC V5H 0H6
  // GPS 坐标：诊所内部实际测量位置
  const CLINIC_LOCATION = {
    latitude: 49.22638785190632,   // 诊所内部实际纬度
    longitude: -123.0065530208069, // 诊所内部实际经度
    radius: 50  // 允许的范围（米），考虑GPS精度
  };

  useEffect(() => {
    checkClockStatus();
    // 管理员不需要位置验证
    if (user?.role === 'admin') {
      setLocationStatus('allowed');
      setLocationError('');
    } else {
      checkLocation();
    }
  }, []);

  // 计算两个坐标之间的距离（米）
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // 距离（米）
  };

  // 检查用户位置
  const checkLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('您的浏览器不支持地理位置功能');
      setLocationStatus('denied');
      return;
    }

    setLocationStatus('checking');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const distance = calculateDistance(
          latitude,
          longitude,
          CLINIC_LOCATION.latitude,
          CLINIC_LOCATION.longitude
        );

        console.log(`当前位置: ${latitude}, ${longitude}`);
        console.log(`距离诊所: ${Math.round(distance)} 米`);

        if (distance <= CLINIC_LOCATION.radius) {
          setLocationStatus('allowed');
          setLocationError('');
        } else {
          setLocationStatus('denied');
          setLocationError(`您必须在诊所范围内才能打卡（当前距离: ${Math.round(distance)}米）`);
        }
      },
      (error) => {
        console.error('地理位置错误:', error);
        setLocationStatus('denied');
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('请允许访问您的位置信息才能打卡');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('无法获取位置信息');
            break;
          case error.TIMEOUT:
            setLocationError('获取位置信息超时');
            break;
          default:
            setLocationError('获取位置信息失败');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

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
        // API returns clock_in in format "YYYY-MM-DD HH:mm:ss" (Vancouver local time)
        const clockInStr = record.clock_in;
        if (clockInStr) {
          try {
            // Parse MySQL datetime format "YYYY-MM-DD HH:mm:ss" as local time
            const isoStr = clockInStr.replace(' ', 'T');
            const clockInTime = new Date(isoStr);
            
            if (isValid(clockInTime)) {
              // Display as-is (already in local time)
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
      
      // 清空notes
      setNotes('');
      
      // 稍微延迟一下再检查状态，确保数据库已更新
      await new Promise(resolve => setTimeout(resolve, 300));
      await checkClockStatus();
      
      // 重新检测位置，为下次操作（clock out）做准备
      // 管理员不需要位置验证
      if (user?.role !== 'admin') {
        checkLocation();
      }
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
      
      // 重新检测位置，为下次操作（新的 clock in）做准备
      // 管理员不需要位置验证
      if (user?.role !== 'admin') {
        checkLocation();
      }

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

        {/* 位置状态提示 */}
        {locationStatus === 'checking' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            正在获取您的位置...
          </Alert>
        )}
        {locationStatus === 'allowed' && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {user?.role === 'admin' 
              ? '✓ 管理员账户 - 可从任何位置登录打卡' 
              : '✓ 位置验证成功 - 您在诊所范围内'}
          </Alert>
        )}
        {locationStatus === 'denied' && locationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {locationError}
            <Button size="small" onClick={checkLocation} sx={{ mt: 1, display: 'block' }}>
              重新检测位置
            </Button>
          </Alert>
        )}

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
              Clocked in since: {currentRecord.clock_in ? format(new Date(currentRecord.clock_in.replace(' ', 'T')), 'yyyy-MM-dd HH:mm:ss') : 'N/A'}
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
              disabled={loading || locationStatus !== 'allowed'}
            >
              Clock Out
            </Button>
          ) : (
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleClockIn}
              disabled={loading || locationStatus !== 'allowed'}
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