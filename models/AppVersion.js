const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppVersion = sequelize.define('AppVersion', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  platform: {
    type: DataTypes.ENUM('android', 'ios'),
    allowNull: false
  },
  version: {
    type: DataTypes.STRING, // e.g., "1.0.1"
    allowNull: false
  },
  buildNumber: {
    type: DataTypes.INTEGER, // e.g., 2
    allowNull: false
  },
  forceUpdate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  title: {
    type: DataTypes.STRING,
    defaultValue: 'Update Available'
  },
  message: {
    type: DataTypes.TEXT,
    defaultValue: 'A new version of Nsimbi is available. Please update to continue.'
  },
  storeUrl: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = AppVersion;
