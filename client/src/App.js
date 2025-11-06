import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Container } from '@mui/material';
import { useSelector } from 'react-redux';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ClockInOut from './components/clock/ClockInOut';
import RecordsList from './components/clock/RecordsList';
import ClockRequestForm from './components/clock/ClockRequestForm';
import MyClockRequests from './components/clock/MyClockRequests';
import UserManagement from './components/admin/UserManagement';
import PrivateRoute from './components/layout/PrivateRoute';
import AdminNavbar from './components/admin/AdminNavbar';
import RecordsSummary from './components/admin/RecordsSummary';
import ClockRequestsManagement from './components/admin/ClockRequestsManagement';

function App() {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  return (
    <>
      <CssBaseline />
      {isAuthenticated && (user?.role === 'admin' ? <AdminNavbar /> : <Navbar />)}
      <Container maxWidth="lg" sx={{ mt: isAuthenticated ? 4 : 0, mb: isAuthenticated ? 4 : 0 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* 根路径：直接重定向到登录页 */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {user?.role === 'admin' ? 
                  <Navigate to="/admin/summary" replace /> : 
                  <ClockInOut />
                }
              </PrivateRoute>
            }
          />
          
          {/* Regular User Routes */}
          <Route
            path="/records"
            element={
              <PrivateRoute>
                <RecordsList />
              </PrivateRoute>
            }
          />
          <Route
            path="/clock-requests"
            element={
              <PrivateRoute>
                <>
                  <ClockRequestForm />
                  <Container sx={{ mt: 4 }}>
                    <MyClockRequests />
                  </Container>
                </>
              </PrivateRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute adminOnly>
                <Navigate to="/admin/summary" replace />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/summary"
            element={
              <PrivateRoute adminOnly>
                <RecordsSummary />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute adminOnly>
                <UserManagement />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/clock-requests"
            element={
              <PrivateRoute adminOnly>
                <ClockRequestsManagement />
              </PrivateRoute>
            }
          />
          
          {/* 未匹配的路由重定向 */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Container>
    </>
  );
}

export default App;