const socketIo = require("socket.io");
const Message = require("../models/Message");

function setupSocketIO(server) {
  const io = socketIo(server);

  io.on("connection", (socket) => {
    console.log("New client connected", socket.id);

    // Listen for joining a chat room
    socket.on("joinChat", (chatId) => {
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
    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });
}

module.exports = setupSocketIO;
