var pandaDocController = require("../controllers/panda-doc.controller");

module.exports = {
  configure: function (app) {
    /**
     * send panda document
     */
    app.route("/send-document").post(function (req, res) {
        pandaDocController.sendPandaDocument(req, res);
    });

    /**
     * send panda document
     */
    app.route("/get-panda-templates").get(function (req, res) {
        pandaDocController.getPandaTemplates(req, res);
    });
    /**
     * panda document webhook
     */
    app.route("/pandadoc-webhook").post(function (req, res) {
        pandaDocController.pandaDocWeebhook(req, res);
    });
  },
};
