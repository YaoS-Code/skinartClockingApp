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
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import { Delete, Info } from '@mui/icons-material';
import api from '../../services/api';

function MyClockRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, requestId: null });

  const loadRequests = async () => {
    try {
      const response = await api.get('/clock-requests/my');
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
    loadRequests();
  }, []);

  const handleDelete = async (requestId) => {
    try {
      await api.delete(`/clock-requests/${requestId}`);
      setRequests(prev => prev.filter(req => req.id !== requestId));
      setDeleteDialog({ open: false, requestId: null });
    } catch (err) {
      setError(err.response?.data?.error || '删除失败');
    }
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

  const getTypeText = (type) => {
    return type === 'clock_in' ? '上班' : '下班';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        我的补打卡申请
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {requests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Info sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography color="text.secondary">
            暂无补打卡申请记录
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
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
                <TableRow key={request.id}>
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
                      <Tooltip title="删除申请">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setDeleteDialog({ open: true, requestId: request.id })}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, requestId: null })}
      >
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          确定要删除这个补打卡申请吗？此操作无法撤销。
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, requestId: null })}>
            取消
          </Button>
          <Button 
            onClick={() => handleDelete(deleteDialog.requestId)} 
            color="error"
            variant="contained"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyClockRequests;

