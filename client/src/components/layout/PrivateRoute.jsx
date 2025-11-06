import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CircularProgress, Box } from '@mui/material';
import api from '../../services/api';

function PrivateRoute({ children, adminOnly = false }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      // 如果未登录，立即返回，不需要验证
      if (!isAuthenticated) {
        setIsLoading(false);
        setIsValid(false);
        return;
      }

      // 如果已登录，验证token
      try {
        await api.get('/auth/profile');
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, [isAuthenticated]);

  // 如果未登录，立即重定向，不显示加载状态
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 如果正在验证token，显示加载状态
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // 如果token无效，重定向到登录页
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // 如果是管理员路由但用户不是管理员，重定向到首页
  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children; // Don't wrap with any additional layout components
}

export default PrivateRoute;