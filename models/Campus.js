const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campus = sequelize.define('Campus', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 12000,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    defaultValue: 'active',
  }
});

module.exports = Campus;
