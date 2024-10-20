const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const setupAssociations = () => {
  // Chat associations
  Chat.belongsTo(User, { as: 'cleaner', foreignKey: 'cleanerId' });
  Chat.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });
  Chat.hasMany(Message, { foreignKey: 'chatId' });

  // Message associations
  Message.belongsTo(Chat, { foreignKey: 'chatId' });
  Message.belongsTo(User, { foreignKey: 'senderId' });
};

module.exports = setupAssociations;
