var basicCtrl = require('../controllers/basic.controller');
const { verifyToken } = require('../auth/security');

module.exports = {
    configure: function (app) {
        /**
         * Main endpoint
         */
        app.route('/').get(function (req, res) {
            basicCtrl.index(req, res);
        });
        /**
         * Verify token
         */
        app.route('/access').get(verifyToken, function (req, res) {
            basicCtrl.verifyToken(req, res);
        });
    }
}