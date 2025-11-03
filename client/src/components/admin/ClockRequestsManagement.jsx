import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import { CheckCircle, Cancel, Info } from '@mui/icons-material';
import api from '../../services/api';

function ClockRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [reviewDialog, setReviewDialog] = useState({
    open: false,
    request: null,
    action: null,
    adminNote: ''
  });

  const loadRequests = async (status = null) => {
    setLoading(true);
    try {
      const params = status ? { status } : {};
      const response = await api.get('/clock-requests/all', { params });
      setRequests(response.data.requests);
      setError('');
    } catch (err) {
      setError('加载申请列表失败');
      console.error('Load requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statusMap = ['pending', 'approved', 'rejected', null];
    loadRequests(statusMap[tabValue]);
  }, [tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const openReviewDialog = (request, action) => {
    setReviewDialog({
      open: true,
      request,
      action,
      adminNote: ''
    });
    setError('');
    setSuccess('');
  };

  const closeReviewDialog = () => {
    setReviewDialog({
      open: false,
      request: null,
      action: null,
      adminNote: ''
    });
  };

  const handleReview = async () => {
    try {
      await api.post(`/clock-requests/${reviewDialog.request.id}/review`, {
        action: reviewDialog.action,
        admin_note: reviewDialog.adminNote
      });

      const actionText = reviewDialog.action === 'approve' ? '批准' : '拒绝';
      setSuccess(`申请已${actionText}`);
      
      // Refresh the list
      const statusMap = ['pending', 'approved', 'rejected', null];
      await loadRequests(statusMap[tabValue]);
      
      closeReviewDialog();
    } catch (err) {
      setError(err.response?.data?.error || '操作失败');
    }
  };

  const getTypeText = (type) => {
    return type === 'clock_in' ? '上班' : '下班';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待审批';
      case 'approved':
        return '已批准';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading && requests.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        补打卡申请管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label={`待审批 ${pendingCount > 0 ? `(${pendingCount})` : ''}`} />
          <Tab label="已批准" />
          <Tab label="已拒绝" />
          <Tab label="全部" />
        </Tabs>
      </Paper>

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Info sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            暂无申请记录
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>员工</TableCell>
                <TableCell>类型</TableCell>
                <TableCell>日期</TableCell>
                <TableCell>时间</TableCell>
                <TableCell>原因</TableCell>
                <TableCell>状态</TableCell>
                <TableCell>审批人</TableCell>
                <TableCell>备注</TableCell>
                <TableCell>提交时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((request) => (
                <TableRow 
                  key={request.id}
                  sx={{ 
                    backgroundColor: request.status === 'pending' ? 'action.hover' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {request.user_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.user_email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getTypeText(request.request_type)}
                      size="small"
                      color={request.request_type === 'clock_in' ? 'primary' : 'secondary'}
                    />
                  </TableCell>
                  <TableCell>{request.request_date}</TableCell>
                  <TableCell>{request.request_time}</TableCell>
                  <TableCell>
                    <Tooltip title={request.reason}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          maxWidth: 200, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {request.reason}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(request.status)}
                      color={getStatusColor(request.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{request.admin_name || '-'}</TableCell>
                  <TableCell>
                    {request.admin_note ? (
                      <Tooltip title={request.admin_note}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 150, 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {request.admin_note}
                        </Typography>
                      </Tooltip>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    {new Date(request.created_at).toLocaleString('zh-CN')}
                  </TableCell>
                  <TableCell>
                    {request.status === 'pending' && (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="批准">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => openReviewDialog(request, 'approve')}
                          >
                            批准
                          </Button>
                        </Tooltip>
                        <Tooltip title="拒绝">
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Cancel />}
                            onClick={() => openReviewDialog(request, 'reject')}
                          >
                            拒绝
                          </Button>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialog.open}
        onClose={closeReviewDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {reviewDialog.action === 'approve' ? '批准' : '拒绝'}补打卡申请
        </DialogTitle>
        <DialogContent>
          {reviewDialog.request && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>员工：</strong> {reviewDialog.request.user_name}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>类型：</strong> {getTypeText(reviewDialog.request.request_type)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>日期时间：</strong> {reviewDialog.request.request_date} {reviewDialog.request.request_time}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>原因：</strong> {reviewDialog.request.reason}
              </Typography>
            </Box>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label="备注（可选）"
            value={reviewDialog.adminNote}
            onChange={(e) => setReviewDialog(prev => ({ ...prev, adminNote: e.target.value }))}
            placeholder="添加审批备注..."
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeReviewDialog}>
            取消
          </Button>
          <Button 
            onClick={handleReview} 
            color={reviewDialog.action === 'approve' ? 'success' : 'error'}
            variant="contained"
          >
            确认{reviewDialog.action === 'approve' ? '批准' : '拒绝'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ClockRequestsManagement;

