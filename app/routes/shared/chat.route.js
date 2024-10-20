var chatCtrl = require('../../controllers/shared/chat.controller');
const { verifyToken } = require('../../auth/security');

module.exports = {
    configure: function (app) {
        /**
         * Create Chat
         */
        app.route('/chats').post(function (req, res) {
            chatCtrl.createChat(req, res);
        });
        /**
         * Get Messages
         */
        app.route('/chats/:chatId/messages').get( function (req, res) {
            chatCtrl.getChatMessages(req, res);
        });

        /**
         * Get All Chats for a User
         */
        app.route('/chats/user/:userId').get(function (req, res) {
            chatCtrl.getUserChats(req, res);
        });
    }
}