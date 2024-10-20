const Chat = require("../../models/Chat");
const Message = require("../../models/Message");

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
}
module.exports = new chatController();
