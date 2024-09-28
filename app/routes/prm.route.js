var prmCtrl = require('../controllers/prm.controller');

module.exports = {
    configure: function (app) {
        /**
         * Prm/twilio
         */
        app.route('/prm/twilio').post(function (req, res) {
            prmCtrl.twilio(req, res);
        });
    }
}