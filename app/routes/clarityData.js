var clarityDataCtrl = require('./../controllers/clarityDataController');

module.exports = {
    configure: function (app) {
        /**
         * Clarity Data
         */
        app.route('/clarityData').post(function (req, res) {
            clarityDataCtrl.clarityData(req, res);
        });
    }
}