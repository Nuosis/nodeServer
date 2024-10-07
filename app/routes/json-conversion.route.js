const jsonConversionCtrl = require("../controllers/json-conversion.controller");

module.exports = {
  configure: function (app) {
    /**
     * XLS to JSON Converter
     */
    app.route('/convert-xlsx-to-json').post(function (req, res) {
      jsonConversionCtrl.convertXlsxToJson(req, res);
    });
  }
}


