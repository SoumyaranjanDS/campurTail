const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { requireAdmin, requireStaffOrAdmin } = require('../middleware/role');
const admin = require('../controllers/adminController');

// All routes require auth
router.use(authMiddleware);

// --- Dashboard ---
router.get('/dashboard', requireStaffOrAdmin, admin.getDashboardStats);

// --- Staff Management (admin only) ---
router.post('/staff', requireAdmin, admin.createStaff);
router.get('/staff', requireAdmin, admin.getAllStaff);
router.delete('/staff/:id', requireAdmin, admin.deleteStaff);

// --- Reports (admin/staff) ---
router.get('/reports', requireStaffOrAdmin, admin.getAllReports);
router.patch('/reports/:id/status', requireStaffOrAdmin, admin.updateReportStatus);

// --- Users (admin only) ---
router.get('/users', requireAdmin, admin.getAllUsers);

module.exports = router;
