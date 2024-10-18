// External Imports
const { HttpStatusCode } = require("axios");

// Internal Imports
const Business = require("../models/Business");

function businessController() {
  this.createBusiness = async function (req, res) {
    try {
      const data = req.body;
      const business = await Business.findOne({
        where: { contact: data.contact },
      });

      if (business)
        return res.status(HttpStatusCode.BadRequest).json({
          message: "Business with same contact number is already existing",
        });

      await Business.create(data);

      return res
        .status(HttpStatusCode.Ok)
        .json({ message: "Business created successfully!" });
    } catch (error) {
      res
        .status(HttpStatusCode.InternalServerError)
        .json({ message: error.message });
    }
  };

  this.getBusiness = async function (req, res) {
    try {
      const business = await Business.findOne({ where: { id: req.params.id } });

      if (!business)
        return res.status(HttpStatusCode.NotFound).json({
          message: "Business not found",
        });

      return res.status(HttpStatusCode.Ok).json({ data: business });
    } catch (error) {
      res
        .status(HttpStatusCode.InternalServerError)
        .json({ message: error.message });
    }
  };
}

module.exports = new businessController();
