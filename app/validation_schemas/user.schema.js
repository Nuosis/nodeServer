const Joi = require("joi");
const USER_SCHEMAS = {
  register: Joi.object()
    .keys({
      username: Joi.string().required(),
      email: Joi.string().required(),
      role: Joi.string().required(),
      password: Joi.string().required(),
      filemakerId: Joi.string(),
      companyId: Joi.string(),
      verified: Joi.boolean(),
      access: Joi.string(),
      status: Joi.string(),
    })
    .strict(),
  updateUser: Joi.object()
    .keys({
      filemakerId: Joi.string(),
      companyId: Joi.string(),
      verified: Joi.boolean(),
      access: Joi.string(),
      status: Joi.string(),
    })
    .or("filemakerId", "companyId", "verified", "access", "status")
    .strict(),
  changePassword: Joi.object()
    .keys({
      resetKey: Joi.string().required(),
      newPassword: Joi.string().required(),
    })
    .strict(),
  resetPassword: Joi.object()
    .keys({
      email: Joi.string().required(),
    })
    .strict(),
  // define all the other schemas below
};
module.exports = USER_SCHEMAS;
