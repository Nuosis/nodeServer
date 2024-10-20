const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

const setupAssociations = () => {
  // Chat associations
  Chat.belongsTo(User, { as: 'cleaner', foreignKey: 'cleanerId', onDelete: 'CASCADE'  });
  Chat.belongsTo(User, { as: 'customer', foreignKey: 'customerId', onDelete: 'CASCADE'  });
  Chat.hasMany(Message, { foreignKey: 'chatId', onDelete: 'CASCADE'  });

  // Message associations
  Message.belongsTo(Chat, { foreignKey: 'chatId', onDelete: 'CASCADE'  });
  Message.belongsTo(User, { foreignKey: 'senderId', onDelete: 'CASCADE'  });
};

module.exports = setupAssociations;
