// models/CompanyPermissions.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance

const CompanyPermissions = sequelize.define(
  "CompanyPermissions",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true, // Automatically increment ID
    },
    companyId: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    permission: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY, // Use DATEONLY for date without time
      allowNull: true,
    },
    expireDate: {
      type: DataTypes.DATEONLY, // Use DATEONLY for date without time
      allowNull: true,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW, // Defaults to current timestamp
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "companyPermissions",
    timestamps: false, // Disable automatic timestamps
  }
);

module.exports = CompanyPermissions;
