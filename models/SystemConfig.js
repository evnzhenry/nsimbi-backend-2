const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SystemConfig = sequelize.define('SystemConfig', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  value: {
    type: DataTypes.JSON, // Use JSON to store complex values like fees/rules
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.INTEGER, // User ID of super admin who updated it
    allowNull: true,
  }
});

module.exports = SystemConfig;
