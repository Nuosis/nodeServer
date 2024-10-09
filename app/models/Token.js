// models/Token.js
const { DataTypes } = require("sequelize");
const sequelize = require("../db"); // Import your Sequelize instance
const User = require("./User");

const Token = sequelize.define(
  "Token",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.TEXT, // Make sure the type matches with User.id type
      allowNull: false,
      references: {
        model: User, // Reference to the User model
        key: "id", // The column in User table to reference
      },
      onDelete: "CASCADE", // Delete the token if the related user is deleted
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expiryTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tokenType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "token",
    timestamps: false, // Disable automatic timestamps (createdAt, updatedAt)
  }
);

module.exports = Token;
