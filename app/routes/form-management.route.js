const formManagementCtrl = require("../controllers/form-management.controller");

module.exports = {
    configure: function (app) {
        /**
         * Tokeize
         */
        app.route('/tokenize').post(function (req, res) {
            formManagementCtrl.tokenize(req, res);
        });
        /**
         * Get token data
         */
        app.route('/getTokenData').get(function (req, res) {
            formManagementCtrl.getTokenData(req, res);
        });
    }
}
