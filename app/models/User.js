// models/User.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance
const { USER_ROLES, USER_STATUS } = require("../utils/constants");
const { generateUUID } = require("../../app/auth/security.js");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
      unique: true,
      defaultValue: () => generateUUID(), // Pass the function without invoking it to avoid duplicate id issue
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
    firstName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    lastName: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    city: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    province: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "",
    },
    age: {
      type: DataTypes.NUMBER,
      allowNull: true,
    },
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true,
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
    status: {
      type: DataTypes.ENUM,
      values: Object.values(USER_STATUS),
      allowNull: true,
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
