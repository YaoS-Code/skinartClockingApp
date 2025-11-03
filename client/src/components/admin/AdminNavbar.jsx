// src/components/admin/AdminNavbar.jsx
import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import NotificationMenu from '../layout/NotificationMenu';

function AdminNavbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component={Link} 
          to="/admin/summary" 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'inherit' 
          }}
        >
          SkinartMD 管理
        </Typography>
        
        <Button 
          color="inherit" 
          component={Link} 
          to="/admin/summary"
          sx={{ 
            backgroundColor: location.pathname === '/admin/summary' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          汇总
        </Button>
        
        <Button 
          color="inherit" 
          component={Link} 
          to="/admin/users"
          sx={{ 
            backgroundColor: location.pathname === '/admin/users' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          员工管理
        </Button>
        
        <Button 
          color="inherit" 
          component={Link} 
          to="/admin/clock-requests"
          sx={{ 
            backgroundColor: location.pathname === '/admin/clock-requests' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
          }}
        >
          补打卡审批
        </Button>
        
        <Box sx={{ ml: 1 }}>
          <NotificationMenu />
        </Box>
        
        <Button 
          color="inherit" 
          onClick={handleLogout}
        >
          退出
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default AdminNavbar;