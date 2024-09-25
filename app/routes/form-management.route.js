const express = require("express");
const formManagementController = require("../controllers/form-management.controller");

const router = express.Router();

router.post("/tokenize", formManagementController.tokenize);
router.post("/getTokenData", formManagementController.getTokenData);

module.exports = router;
