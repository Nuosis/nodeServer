const fileManagementCtrl = require("../controllers/file-management.controller");

module.exports = {
    configure: function (app) {
        /**
         * Move to images
         */
        app.route('/moveToImages').post(function (req, res) {
            fileManagementCtrl.movetoImages(req, res);
        });
    }
}

