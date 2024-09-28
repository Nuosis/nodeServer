var loggingCtrl = require('../controllers/logging.controller');

module.exports = {
    configure: function (app) {
        /**
         * Create logs
         */
        app.route('/log').post(function (req, res) {
            loggingCtrl.createLog(req, res);
        });
        /**
         * Get logs
         */
        app.route('/log').get(function (req, res) {
            loggingCtrl.getLog(req, res);
        });
    }
}