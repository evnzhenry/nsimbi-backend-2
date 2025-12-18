const { User, Transaction, Campus, SystemConfig, AuditLog, Wallet, Sequelize } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total Users Breakdown
    const users = await User.count({
      attributes: ['role'],
      group: ['role']
    });

    // 2. Transaction Volume (Last 30 days)
    const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30));
    const transactionStats = await Transaction.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });

    // 3. Revenue Streams (Simulated logic based on transaction types)
    // In a real app, this would calculate fees. Here we sum volumes.
    const revenueStreams = await Transaction.findAll({
      attributes: [
        'type',
        [Sequelize.fn('SUM', Sequelize.col('amount')), 'totalAmount']
      ],
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      },
      group: ['type']
    });

    // 4. Campus Performance
    const campuses = await Campus.findAll({
      include: [{
        model: User,
        as: 'Users',
        attributes: [],
      }],
      attributes: [
        'name',
        [Sequelize.fn('COUNT', Sequelize.col('Users.id')), 'userCount']
      ],
      group: ['Campus.id'],
      raw: true
    });

    res.json({
      users,
      transactionCount30d: transactionStats,
      revenueStreams,
      campuses
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCampus = async (req, res) => {
  try {
    const { name, location, capacity } = req.body;
    const campus = await Campus.create({ name, location, capacity });
    
    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_CAMPUS',
      targetId: campus.id,
      targetModel: 'Campus',
      details: { name, location }
    });

    res.json(campus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createCampusAdmin = async (req, res) => {
  try {
    const { name, email, password, campusId } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    
    const admin = await User.create({
      name,
      email,
      password: passwordHash,
      role: 'campus_admin',
      campusId
    });

    // Create wallet for admin (optional, but good for consistency)
    await Wallet.create({ userId: admin.id, balance: 0 });

    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_CAMPUS_ADMIN',
      targetId: admin.id,
      targetModel: 'User',
      details: { campusId }
    });

    res.json({ message: 'Campus Admin created', admin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSystemConfig = async (req, res) => {
  try {
    const config = await SystemConfig.findAll();
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateSystemConfig = async (req, res) => {
  try {
    const { key, value, description } = req.body;
    let config = await SystemConfig.findOne({ where: { key } });

    if (config) {
      config.value = value;
      config.description = description || config.description;
      config.updatedBy = req.user.id;
      await config.save();
    } else {
      config = await SystemConfig.create({
        key,
        value,
        description,
        updatedBy: req.user.id
      });
    }

    await AuditLog.create({
      userId: req.user.id,
      action: 'UPDATE_CONFIG',
      details: { key, value }
    });

    res.json(config);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAllCampuses = async (req, res) => {
  try {
    const campuses = await Campus.findAll({
      include: [
        {
          model: User,
          as: 'Users',
          where: { role: 'campus_admin' },
          required: false,
          attributes: ['id', 'name', 'email']
        }
      ]
    });
    res.json(campuses);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
