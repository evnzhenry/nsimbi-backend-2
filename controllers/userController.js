const { User } = require('../models');
const { Op } = require('sequelize');

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = {};
    
    // Filter by campus if campus_admin
    if (req.user.role === 'campus_admin' && req.user.campusId) {
      whereClause.campusId = req.user.campusId;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentIdNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users: rows,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentClass, studentIdNumber, nfcCardId, cardPin, campusId: bodyCampusId } = req.body;
    const bcrypt = require('bcrypt');
    const { User, Wallet, Campus, AuditLog } = require('../models');

    let campusId = bodyCampusId;

    // If campus_admin, enforce their campusId and check capacity
    if (req.user.role === 'campus_admin') {
        campusId = req.user.campusId;
        if (!campusId) return res.status(400).json({ message: 'No campus assigned to admin' });
        
        const campus = await Campus.findByPk(campusId);
        if (!campus) return res.status(400).json({ message: 'Campus not found' });

        const currentCount = await User.count({ where: { campusId } });
        if (currentCount >= campus.capacity) {
             return res.status(400).json({ message: 'Campus capacity reached' });
        }
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    let hashedPin = null;
    if (cardPin) {
      hashedPin = await bcrypt.hash(cardPin, 10);
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      campusId,
      studentClass,
      studentIdNumber,
      nfcCardId,
      cardPin: hashedPin
    });

    await Wallet.create({ userId: user.id, balance: 0 });

    // Create Audit Log
    await AuditLog.create({
      userId: req.user.id,
      action: 'CREATE_USER',
      targetId: user.id,
      targetModel: 'User',
      details: { role, campusId, createdBy: req.user.role }
    });

    res.status(201).json({ message: 'User created successfully', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPin = async (req, res) => {
  try {
    const { userId, newPin } = req.body;
    const bcrypt = require('bcrypt');

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPin = await bcrypt.hash(newPin, 10);
    user.cardPin = hashedPin;
    await user.save();

    res.json({ message: 'PIN reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.syncNfc = async (req, res) => {
  try {
    const { userId, nfcCardId } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.nfcCardId = nfcCardId;
    await user.save();

    res.json({ message: 'NFC Card synced successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
