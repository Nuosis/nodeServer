var registrationCtrl = require('../controllers/registration.controller');

module.exports = {
    configure: function (app) {
        /**
         * Send verification
         */
        app.route('/send_verification').get(function (req, res) {
            registrationCtrl.SendVerification(req, res);
        });
        /**
         * Email verification
         */
        app.route('/email_verification').get(function (req, res) {
            registrationCtrl.EmailVerification(req, res);
        });
    }
}