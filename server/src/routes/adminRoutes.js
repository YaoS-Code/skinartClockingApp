const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const {
    getRecordsSummaryByPeriod,
    getUserRecords,
    modifyRecord,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require('../controllers/adminController');

// All routes require authentication and admin privileges
router.use(auth);
router.use(adminAuth);

// Get records summary by period
router.get('/records/summary', getRecordsSummaryByPeriod);

// User Management Routes (CRUD)
// Get all users
router.get('/users', getAllUsers);

// Create new user
router.post('/users', createUser);

// Get specific user's records
router.get('/users/:user_id/records', getUserRecords);

// Update user
router.put('/users/:id', updateUser);

// Update user status (active/inactive)
router.patch('/users/:id/status', updateUserStatus);

// Delete user (soft delete - sets status to inactive)
router.delete('/users/:id', deleteUser);

// Record Management Routes
// Modify record
router.put('/records/:id', modifyRecord);

module.exports = router;