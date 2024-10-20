const socketIo = require("socket.io");
const Message = require("../models/Message");
const User = require('../models/User')

function setupSocketIO(server) {
  const io = socketIo(server);

  io.on("connection", async (socket) => {
    console.log("New client connected", socket.id);

    const userId = socket.handshake.query.userId;

    // Mark the user as online when they connect
    if (userId) {
      await User.update({ isOnline: true }, { where: { id: userId } });
      console.log(`User ${userId} is now online`);

      socket.broadcast.emit("userStatusChanged", { userId, isOnline: true });
    }

    // Listen for joining a chat room
    socket.on("joinChat", (chatRoomObj) => {
      const { chatId } = chatRoomObj;
      if (chatId) {
        socket.join(chatId);
        console.log(`User joined chat room: ${chatId}`);
      } else {
        console.error("Chat ID is required to join a room.");
      }
    });

    // Listen for sending messages
    socket.on("sendMessage", async (message) => {
      if (typeof message === 'string') {
        message = JSON.parse(message);
      }
      const { chatId, senderId, content } = message;

      if (!chatId || !senderId || !content) {
        console.error("Invalid message format");
        socket.emit("errorMessage", { error: "Invalid message format. Ensure chatId, senderId, and content are provided." });
        return;
      }

      try {
        const newMessage = await Message.create({ chatId, senderId, content });

        // Emit the message to the users in the chat room
        io.to(chatId).emit("receiveMessage", newMessage);

        socket.emit("messageSent", { success: true, message: newMessage });

      } catch (error) {
        console.error("Failed to send message:", error.message);
        socket.emit("errorMessage", { error: "Failed to save message. Please try again." });
      }
    });

    // Handle disconnection
    socket.on("disconnect", async() => {
      console.log("Client disconnected", socket.id);

      if (userId) {
        // Mark the user as offline when they disconnect
        await User.update({ isOnline: false }, { where: { id: userId } });
        console.log(`User ${userId} is now offline`);

        socket.broadcast.emit("userStatusChanged", { userId, isOnline: false });
      }
    });
  });
}

module.exports = setupSocketIO;
