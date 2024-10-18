const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const { generateUUID } = require("../../app/auth/security.js");

const Business = sequelize.define(
  "Business",
  {
    id: {
      type: DataTypes.TEXT,
      primaryKey: true,
      unique: true,
      defaultValue: generateUUID(),
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    registrationNumber: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    contact: {
      type: DataTypes.TEXT,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "business",
    timestamps: false, // Disable automatic timestamps
    indexes: [
      {
        unique: true,
        fields: ["contact"],
      },
    ],
  }
);

module.exports = Business;
