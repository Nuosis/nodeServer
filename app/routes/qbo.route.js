var qboCtrl = require('../controllers/qbo.controller');

module.exports = {
    configure: function (app) {
        /**
         * Endpoint to handle Stripe requests
         */
        app.route('/qbo').post(function (req, res) {
            qboCtrl.qboStripe(req, res);
        });
    }
}