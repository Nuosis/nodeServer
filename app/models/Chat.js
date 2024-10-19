const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const User = require("./User");

const Chat = sequelize.define("Chat", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  cleanerId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: "id",
    },
    allowNull: false,
  },
  customerId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: "id",
    },
    allowNull: false,
  }
}, {
  timestamps: true,
});

module.exports = Chat;
