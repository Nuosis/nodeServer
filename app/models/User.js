// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../db'); // Import your Sequelize instance

const User = sequelize.define('User', {
  id: {
    type: DataTypes.TEXT,
    primaryKey: true,
    unique: true,
  },
  filemakerId: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  companyId: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  password: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  username: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  access: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'standard',
  },
  resetPassword: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  },
  created: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: true,
  },
  modified: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: false, // Disable automatic timestamps
  indexes: [
    {
      unique: true,
      fields: ['username', 'companyId'],
    },
  ],
});

module.exports = User;
