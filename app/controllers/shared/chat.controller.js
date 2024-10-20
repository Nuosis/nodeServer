const Chat = require("../../models/Chat");
const Message = require("../../models/Message");
const { Op } = require("sequelize");
const User = require("../../models/User");

function chatController() {
  this.createChat = async (req, res) => {
    const { cleanerId, customerId } = req.body;
    try {
      const chat = await Chat.create({ cleanerId, customerId });

      if (!cleanerId || !customerId) {
        return res.status(400).json({ error: "Both cleanerId and customerId are required." });
      }

      res.status(201).json(chat);
    } catch (error) {
      res.status(500).json({ error: "Failed to create chat.", message: error.message });
    }
  };

  this.getChatMessages = async (req, res) => {
    const { chatId } = req.params;
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required." });
    }

    try {
      const messages = await Message.findAll({
        where: { chatId },
        order: [["sentAt", "ASC"]],
      });
      res.status(200).json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve messages.", message: error.message });
    }
  };

  this.getUserChats = async (req, res) => {
    const { userId } = req.params;
    try {
      const chats = await Chat.findAll({
        where: {
          [Op.or]: [
            { cleanerId: userId },  // If the user is a cleaner
            { customerId: userId }, // If the user is a customer
          ]
        },
        include: [
          { model: User, as: 'cleaner', attributes: ['id', 'username'] },
          { model: User, as: 'customer', attributes: ['id', 'username'] },
          { model: Message, order: [['createdAt', 'DESC']], limit: 1 }  // Get the last message in the chat
        ]
      });
      res.status(200).json(chats);
    } catch (error) {
      res.status(500).json({ error: "Failed to retrieve chats for the user." });
    }
  };  
  
}
module.exports = new chatController();
