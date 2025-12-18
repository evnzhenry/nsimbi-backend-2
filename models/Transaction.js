const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  type: {
    type: DataTypes.ENUM('topup', 'transfer', 'payment'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  fromUserId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Null for external topups maybe? Or system account
  },
  toUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  indexes: [
    {
      fields: ['fromUserId']
    },
    {
      fields: ['toUserId']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt'] // Good for date filtering
    }
  ]
});

module.exports = Transaction;
