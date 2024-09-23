var basicCtrl = require('./../controllers/basicController');

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
        app.route('/access').get(function (req, res) {
            basicCtrl.verifyToken(req, res);
        });
    }
}