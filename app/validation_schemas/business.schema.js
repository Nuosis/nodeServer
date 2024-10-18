const Joi = require("joi");
const BUSINESS_SCHEMAS = {
  createBusiness: Joi.object()
    .keys({
      name: Joi.string().required(),
      contact: Joi.string().required(),
      location: Joi.string().required(),
      registrationNumber: Joi.string().required(),
    })
    .strict(),
  // define all the other schemas below
};
module.exports = BUSINESS_SCHEMAS;
