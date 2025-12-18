const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetId: {
    type: DataTypes.INTEGER, // ID of the object being acted upon (User, Campus, etc.)
    allowNull: true,
  },
  targetModel: {
    type: DataTypes.STRING, // 'User', 'Campus', etc.
    allowNull: true,
  },
  details: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  }
});

module.exports = AuditLog;
