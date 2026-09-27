const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const authMiddleware = require('../middleware/auth');
const { requireStaffOrAdmin } = require('../middleware/role');
const { parser: upload } = require('../config/cloudinary');

// All staff routes require auth and staff/admin role
router.use(authMiddleware, requireStaffOrAdmin);

router.get('/reports', staffController.getAssignedReports);
router.patch('/reports/:id/status', upload.single('photo'), staffController.updateStatus);
router.get('/stats', staffController.getStaffStats);

module.exports = router;
