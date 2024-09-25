// models/Log.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance

const Log = sequelize.define(
  "Log",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
      unique: true,
    },
    logID: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    userID: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Automatically set the creation timestamp
    },
    date: {
      type: DataTypes.DATEONLY,
      defaultValue: "no data", // Default value as specified in SQL schema
      allowNull: false,
    },
  },
  {
    tableName: "log",
    timestamps: false, // Disable automatic timestamps (createdAt, updatedAt)
  }
);

module.exports = Log;
