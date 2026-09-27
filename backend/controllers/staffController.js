const Incident = require('../models/Incident');
const IncidentUpdate = require('../models/IncidentUpdate');
const User = require('../models/User');

// Get reports assigned to this staff member (or their department)
exports.getAssignedReports = async (req, res) => {
  try {
    const staffId = req.user.userId;
    const staffUser = await User.findById(staffId);
    
    if (!staffUser || staffUser.role !== 'staff') {
      return res.status(403).json({ message: 'Forbidden: Staff only' });
    }

    // Reports assigned specifically to this staff, or reports in their department that are unassigned
    const filter = {
      $or: [
        { assignedTo: staffId },
        { category: staffUser.department, assignedTo: null }
      ]
    };

    const reports = await Incident.find(filter)
      .populate('reportedBy', 'name registrationNumber branch')
      .populate('assignedTo', 'name registrationNumber')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update an incident's status (Requires proof photo for Resolved)
exports.updateStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const staffId = req.user.userId;

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Report not found' });

    // Enforce photo for Resolved
    if (status === 'Resolved' && (!req.file || !req.file.path)) {
      return res.status(400).json({ message: 'A proof photo is required to resolve an issue.' });
    }

    const previousStatus = incident.status;
    incident.status = status;
    if (status === 'In Progress' && !incident.assignedTo) {
      incident.assignedTo = staffId; // Auto assign if they start working on an unassigned ticket
    }
    
    await incident.save();

    const newUpdate = new IncidentUpdate({
      incident: incident._id,
      updatedBy: staffId,
      previousStatus,
      newStatus: status,
      note,
      photo: req.file ? req.file.path : undefined
    });

    await newUpdate.save();
    
    const updated = await Incident.findById(incident._id)
      .populate('reportedBy', 'name registrationNumber branch')
      .populate('assignedTo', 'name registrationNumber');
      
    res.json({ incident: updated, newUpdate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get stats for the staff member
exports.getStaffStats = async (req, res) => {
  try {
    const staffId = req.user.userId;
    
    const [totalAssigned, inProgress, resolved] = await Promise.all([
      Incident.countDocuments({ assignedTo: staffId }),
      Incident.countDocuments({ assignedTo: staffId, status: 'In Progress' }),
      Incident.countDocuments({ assignedTo: staffId, status: 'Resolved' }),
    ]);

    res.json({
      totalAssigned,
      inProgress,
      resolved
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
