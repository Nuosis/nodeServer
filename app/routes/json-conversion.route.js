const express = require("express");
const jsonConversionController = require("../controllers/json-conversion.controller");

const router = express.Router();

// XLSX to JSON SERVICE
router.post(
  "/convert-xlsx-to-json",
  jsonConversionController.convertXlsxToJson
);

module.exports = router;
