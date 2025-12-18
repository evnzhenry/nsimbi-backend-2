const { User } = require('../models');
const { Op } = require('sequelize');

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    const whereClause = {};
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
  // This logic is similar to register in authController but for admin use
  // Redirecting to authController.register logic or implementing separately
  // For MVP, we can reuse authController logic or separate if admin needs more fields
  // Implementing a basic version here
  const authController = require('./authController');
  return authController.register(req, res);
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
