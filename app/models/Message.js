const { DataTypes } = require("sequelize");
const sequelize = require("../db");
const Chat = require("./Chat");
const User = require("./User");

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
  },
  chatId: {
    type: DataTypes.UUID,
    references: {
      model: Chat,
      key: "id",
    },
    allowNull: false,
  },
  senderId: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: "id",
    },
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  }
}, {
  timestamps: true,
});

module.exports = Message;
