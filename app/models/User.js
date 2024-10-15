// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance
const { USER_ROLES } = require("../utils/constants");
const { generateUUID } = require("../../app/auth/security.js");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
      unique: true,
      defaultValue: generateUUID(),
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
    email: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
    role: {
      type: DataTypes.ENUM,
      values: Object.values(USER_ROLES),
      allowNull: false,
      defaultValue: USER_ROLES.CUSTOMER,
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    access: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: "standard",
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
  },
  {
    tableName: "users",
    timestamps: false, // Disable automatic timestamps
    indexes: [
      {
        unique: true,
        fields: ["username", "companyId"],
      },
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

module.exports = User;
