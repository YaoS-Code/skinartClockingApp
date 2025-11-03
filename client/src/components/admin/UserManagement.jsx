// src/components/admin/UserManagement.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../../services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    role: 'user',
  });
  const [editUser, setEditUser] = useState({
    username: '',
    email: '',
    full_name: '',
    role: 'user',
    status: 'active',
    password: '',
  });

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to fetch users');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRegister = async () => {
    try {
      await api.post('/admin/users', newUser);
      setSuccess('User created successfully');
      setOpenDialog(false);
      fetchUsers();
      setNewUser({
        username: '',
        password: '',
        email: '',
        full_name: '',
        role: 'user',
      });
      setError('');
    } catch (error) {
      console.error('Failed to create user:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to create user');
      setSuccess('');
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditUser({
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      status: user.status,
      password: '', // Don't pre-fill password
    });
    setOpenEditDialog(true);
    setError('');
    setSuccess('');
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = {
        username: editUser.username,
        email: editUser.email,
        full_name: editUser.full_name,
        role: editUser.role,
        status: editUser.status,
      };
      
      // Only include password if it's provided
      if (editUser.password && editUser.password.length > 0) {
        if (editUser.password.length < 4) {
          setError('Password must be at least 4 characters long');
          return;
        }
        updateData.password = editUser.password;
      }

      await api.put(`/admin/users/${editingUser.id}`, updateData);
      setSuccess('User updated successfully');
      setOpenEditDialog(false);
      setEditingUser(null);
      fetchUsers();
      setEditUser({
        username: '',
        email: '',
        full_name: '',
        role: 'user',
        status: 'active',
        password: '',
      });
      setError('');
    } catch (error) {
      console.error('Failed to update user:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to update user');
      setSuccess('');
    }
  };

  const handleDeleteClick = (user) => {
    setDeletingUser(user);
    setOpenDeleteDialog(true);
    setError('');
    setSuccess('');
  };

  const handleDeleteUser = async () => {
    try {
      console.log('Deleting user:', deletingUser.id);
      const response = await api.delete(`/admin/users/${deletingUser.id}`);
      console.log('Delete response:', response.data);
      setSuccess(response.data?.message || 'User deleted successfully');
      setOpenDeleteDialog(false);
      setDeletingUser(null);
      fetchUsers();
      setError('');
    } catch (error) {
      console.error('Failed to delete user:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to delete user';
      setError(errorMessage);
      setSuccess('');
      // Keep dialog open if there's an error so user can see the message
      if (error.response?.status !== 400 && error.response?.status !== 404) {
        setOpenDeleteDialog(false);
      }
    }
  };

  const handleStatusToggle = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/users/${user.id}/status`, { status: newStatus });
      setSuccess(`User status updated to ${newStatus}`);
      fetchUsers();
      setError('');
    } catch (error) {
      console.error('Failed to update user status:', error);
      setError(error.response?.data?.error || error.response?.data?.message || 'Failed to update user status');
      setSuccess('');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'user':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          User Management
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

        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
          sx={{ mb: 3 }}
        >
          Add New User
        </Button>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Full Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role}
                      color={getRoleColor(user.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      color={getStatusColor(user.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleString()
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleEditClick(user)}
                      title="Edit user"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleDeleteClick(user)}
                      title="Delete user"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Typography variant="body1" sx={{ textAlign: 'center', mt: 3 }}>
            No users found
          </Typography>
        )}

        {/* Add User Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Register New User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Username"
              margin="dense"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              margin="dense"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              margin="dense"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Full Name"
              margin="dense"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Role</InputLabel>
              <Select
                value={newUser.role}
                label="Role"
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleRegister} 
              variant="contained"
              disabled={!newUser.username || !newUser.password || !newUser.email || !newUser.full_name}
            >
              Register
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Username"
              margin="dense"
              value={editUser.username}
              onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              margin="dense"
              type="email"
              value={editUser.email}
              onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
            />
            <TextField
              fullWidth
              label="Full Name"
              margin="dense"
              value={editUser.full_name}
              onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Role</InputLabel>
              <Select
                value={editUser.role}
                label="Role"
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                value={editUser.status}
                label="Status"
                onChange={(e) => setEditUser({ ...editUser, status: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="New Password (leave blank to keep current)"
              type="password"
              margin="dense"
              value={editUser.password}
              onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
              helperText="Leave blank to keep current password"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button 
              onClick={handleUpdateUser} 
              variant="contained"
              disabled={!editUser.username || !editUser.email || !editUser.full_name}
            >
              Update
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            <Typography>
              Are you sure you want to delete user <strong>{deletingUser?.username}</strong> ({deletingUser?.full_name})?
              <br />
              <br />
              This will deactivate the user account. The user will not be able to log in, but their records will be preserved.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setOpenDeleteDialog(false);
              setError('');
            }}>Cancel</Button>
            <Button 
              onClick={handleDeleteUser} 
              variant="contained"
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default UserManagement;