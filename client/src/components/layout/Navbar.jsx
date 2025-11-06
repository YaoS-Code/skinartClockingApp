import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../store/authSlice';
import NotificationMenu from './NotificationMenu';

function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <AppBar position="static" sx={{ marginBottom: 4 }}>
      <Toolbar>
        <Typography variant="h6" component={Link} to="/dashboard" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          SkinartMD
        </Typography>
        {isAuthenticated ? (
          <>
            <Button color="inherit" component={Link} to="/dashboard">
              打卡
            </Button>
            <Button color="inherit" component={Link} to="/records">
              记录
            </Button>
            <Button color="inherit" component={Link} to="/clock-requests">
              补打卡
            </Button>
            {user?.role === 'admin' && (
              <>
                <Button color="inherit" component={Link} to="/admin/users">
                  员工管理
                </Button>
                <Button color="inherit" component={Link} to="/admin/summary">
                  汇总
                </Button>
              </>
            )}
            <Box sx={{ ml: 1 }}>
              <NotificationMenu />
            </Box>
            <Button color="inherit" onClick={handleLogout}>
              退出
            </Button>
          </>
        ) : (
          <>
            <Button color="inherit" component={Link} to="/login">
              登录
            </Button>
            <Button color="inherit" component={Link} to="/register">
              注册
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Navbar;