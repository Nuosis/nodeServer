const express = require("express");
const fileManagementController = require("../controllers/file-management.controller");

const router = express.Router();

router.post("/moveToImages", fileManagementController.movetoImages);

module.exports = router;
