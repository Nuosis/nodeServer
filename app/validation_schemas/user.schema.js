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
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      address: Joi.string().required(),
      city: Joi.string().required(),
      province: Joi.string().required(),
      age: Joi.number(),
      contractStartDate: Joi.date(),
      contractEndDate: Joi.date(),
    })
    .strict(),
  updateUser: Joi.object()
    .keys({
      filemakerId: Joi.string(),
      companyId: Joi.string(),
      verified: Joi.boolean(),
      access: Joi.string(),
      status: Joi.string(),
      firstName: Joi.string(),
      lastName: Joi.string(),
      address: Joi.string(),
      city: Joi.string(),
      province: Joi.string(),
      age: Joi.number(),
    })
    .or(
      "filemakerId",
      "companyId",
      "verified",
      "access",
      "status",
      "firstName",
      "lastName",
      "address",
      "city",
      "province",
      "age"
    )
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
