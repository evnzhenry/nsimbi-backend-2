const { User, Transaction, Campus, AuditLog, Wallet } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    const campusId = req.user.campusId;
    if (!campusId) return res.status(400).json({ message: 'No campus assigned' });

    // 1. User count in my campus
    const userCount = await User.count({ where: { campusId } });
    
    // 2. Campus Details (Capacity check)
    const campus = await Campus.findByPk(campusId);
    
    // 3. Recent Activity (Users created recently)
    const recentUsers = await User.findAll({
      where: { campusId },
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['name', 'role', 'createdAt']
    });

    res.json({
      campusName: campus.name,
      userCount,
      capacity: campus.capacity,
      capacityWarning: userCount > (campus.capacity * 0.9), // 90% threshold
      recentUsers
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getCampusUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { campusId: req.user.campusId },
      attributes: ['id', 'name', 'email', 'role', 'status', 'studentClass']
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentClass, studentIdNumber } = req.body;
    const campusId = req.user.campusId;

    // Capacity Check
    const currentCount = await User.count({ where: { campusId } });
    const campus = await Campus.findByPk(campusId);
    if (currentCount >= campus.capacity) {
      return res.status(400).json({ message: 'Campus capacity reached' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: passwordHash,
      role,
      campusId,
      studentClass,
      studentIdNumber
    });

    await Wallet.create({ userId: user.id, balance: 0 });

    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_USER',
      targetId: user.id,
      targetModel: 'User',
      details: { role, campusId }
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
