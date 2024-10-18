var businessController = require("../controllers/business.controller");
const { validate } = require("../integrations/joi");
const BUSINESS_SCHEMAS = require("../validation_schemas/business.schema");
module.exports = {
  configure: function (app) {
    /**
     * Get Business
     */
    app.route("/business/:id").get(function (req, res) {
      businessController.getBusiness(req, res);
    });
    /**
     * Create Business
     */
    app
      .route("/business")
      .post(validate(BUSINESS_SCHEMAS.createBusiness), function (req, res) {
        businessController.createBusiness(req, res);
      });
  },
};
