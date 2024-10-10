var accessCtrl = require('../controllers/access.controller');
const { verifyToken, refreshToken } = require('../auth/security');

module.exports = {
    configure: function (app) {
        /**
         * Login
         */
        app.route('/login').post(function (req, res) {
            accessCtrl.login(req, res);
        });
        /**
         * Refresh Token
         */
        app.route('/refresh-token').post(function (req, res) {
            accessCtrl.refreshToken(req, res);
        });
        /**
         * Verify user
         */
        app.route('/verify').get(verifyToken, function (req, res) {
            accessCtrl.verifyUser(req, res);
        });
        /**
         * Github Webhook
         */
        app.route('/github-webhook').post(function (req, res) {
            accessCtrl.githubWebhook(req, res);
        });
    }
}