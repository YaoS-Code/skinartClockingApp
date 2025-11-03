import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress
} from '@mui/material';
import { AccessTime, EventNote } from '@mui/icons-material';
import api from '../../services/api';

function ClockRequestForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    request_type: 'clock_in',
    request_date: new Date().toISOString().split('T')[0],
    request_time: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.request_time || !formData.reason.trim()) {
      setError('请填写所有必填字段');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/clock-requests', formData);
      setSuccess('补打卡申请已提交，等待管理员审批');
      setFormData({
        request_type: 'clock_in',
        request_date: new Date().toISOString().split('T')[0],
        request_time: '',
        reason: ''
      });
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || '提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <EventNote sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h5" component="h2">
          补打卡申请
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        如果忘记打卡，可以在此提交补打卡申请。管理员审批通过后会自动添加打卡记录。
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>打卡类型</InputLabel>
          <Select
            name="request_type"
            value={formData.request_type}
            onChange={handleChange}
            label="打卡类型"
            required
          >
            <MenuItem value="clock_in">上班打卡</MenuItem>
            <MenuItem value="clock_out">下班打卡</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          type="date"
          label="日期"
          name="request_date"
          value={formData.request_date}
          onChange={handleChange}
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            max: new Date().toISOString().split('T')[0]
          }}
          sx={{ mb: 3 }}
          required
        />

        <TextField
          fullWidth
          type="time"
          label="时间"
          name="request_time"
          value={formData.request_time}
          onChange={handleChange}
          InputLabelProps={{
            shrink: true,
          }}
          InputProps={{
            startAdornment: <AccessTime sx={{ mr: 1, color: 'action.active' }} />
          }}
          sx={{ mb: 3 }}
          required
        />

        <TextField
          fullWidth
          multiline
          rows={4}
          label="原因说明"
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          placeholder="请说明为什么需要补打卡..."
          sx={{ mb: 3 }}
          required
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
        >
          {loading ? '提交中...' : '提交申请'}
        </Button>
      </form>
    </Paper>
  );
}

export default ClockRequestForm;

