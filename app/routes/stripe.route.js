var stripeCtrl = require('../controllers/stripe.controller');

module.exports = {
    configure: function (app) {
        /**
         * Endpoint to handle Stripe requests
         */
        app.route('/stripe').post(function (req, res) {
            stripeCtrl.qboStripe(req, res);
        });
    }
}