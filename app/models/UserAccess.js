// models/UserAccess.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance

const UserAccess = sequelize.define(
  "UserAccess",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    endPoint: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY, // For date without time
      allowNull: true,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Defaults to the current timestamp
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userName: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "userAccess",
    timestamps: false, // Disable automatic timestamps
  }
);

module.exports = UserAccess;
