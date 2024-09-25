// models/Company.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance

const Company = sequelize.define(
  "Company",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
    },
    company: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    apiKey: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    idFilemaker: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    modified: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "company",
    timestamps: false, // Disable Sequelize's automatic timestamps
  }
);

module.exports = Company;
