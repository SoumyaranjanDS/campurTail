const User = require('../models/User');
const Incident = require('../models/Incident');

// Create a staff member
exports.createStaff = async (req, res) => {
  const { name, registrationNumber, branch, department } = req.body;
  try {
    if (!name || !registrationNumber || !branch || !department) {
      return res.status(400).json({ message: 'Name, registration number, branch, and department are required.' });
    }

    const existing = await User.findOne({ registrationNumber });
    if (existing) {
      return res.status(400).json({ message: 'Registration number already in use.' });
    }

    const staff = new User({ name, registrationNumber, branch, department, role: 'staff' });
    await staff.save();
    res.status(201).json({ message: 'Staff created successfully', staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a staff member
exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'staff') {
      return res.status(404).json({ message: 'Staff member not found.' });
    }
    await user.deleteOne();
    res.json({ message: 'Staff member removed.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: 'staff' }).select('-__v').sort({ createdAt: -1 });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all reports with full info
exports.getAllReports = async (req, res) => {
  try {
    const { status, category, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const reports = await Incident.find(filter)
      .populate('reportedBy', 'name registrationNumber branch')
      .populate('assignedTo', 'name registrationNumber')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Update report status (admin/staff)
exports.updateReportStatus = async (req, res) => {
  const { status, assignedTo } = req.body;
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Report not found.' });

    if (status) incident.status = status;
    if (assignedTo) incident.assignedTo = assignedTo;

    await incident.save();
    const updated = await Incident.findById(incident._id)
      .populate('reportedBy', 'name registrationNumber branch')
      .populate('assignedTo', 'name registrationNumber');
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all users with their report stats
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'student' }).select('-__v').sort({ createdAt: -1 });

    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const totalReports = await Incident.countDocuments({ reportedBy: user._id });
        const resolvedReports = await Incident.countDocuments({ reportedBy: user._id, status: 'Resolved' });
        return {
          ...user.toObject(),
          totalReports,
          resolvedReports,
          resolutionRate: totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0,
        };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const [totalReports, pendingReports, inProgressReports, resolvedReports, totalUsers, totalStaff] =
      await Promise.all([
        Incident.countDocuments(),
        Incident.countDocuments({ status: 'Pending' }),
        Incident.countDocuments({ status: 'In Progress' }),
        Incident.countDocuments({ status: 'Resolved' }),
        User.countDocuments({ role: 'student' }),
        User.countDocuments({ role: 'staff' }),
      ]);

    // Category breakdown
    const categoryBreakdown = await Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Recent 5 reports
    const recentReports = await Incident.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('reportedBy', 'name registrationNumber');

    res.json({
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      totalUsers,
      totalStaff,
      categoryBreakdown,
      recentReports,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
