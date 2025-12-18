const { Transaction, User } = require('../models');
const { Op } = require('sequelize');

exports.getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { type, page = 1, limit = 20 } = req.query; // Filter by type if needed
    const offset = (page - 1) * limit;

    const whereClause = {
      [Op.or]: [
        { fromUserId: userId },
        { toUserId: userId }
      ]
    };

    if (type) {
      whereClause.type = type;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'Sender', attributes: ['name'] },
        { model: User, as: 'Receiver', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
        transactions: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        totalTransactions: count
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
