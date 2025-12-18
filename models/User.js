const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'parent', 'student', 'merchant'),
    allowNull: false,
    defaultValue: 'parent',
  },
  nfcCardId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, // Assuming NFC IDs are unique
  },
  // Optional: Link parent to student if needed, or handle via separate relation table
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  cardPin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentClass: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  studentIdNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['nfcCardId']
    },
    {
      fields: ['studentIdNumber']
    },
    {
      fields: ['role']
    }
  ]
});

module.exports = User;
