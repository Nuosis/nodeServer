const express = require("express");
const jsonConversionCtrl = require("../controllers/json-conversion.controller");

const router = express.Router();

// XLSX to JSON SERVICE
router.post(
  "/convert-xlsx-to-json",
  jsonConversionCtrl.convertXlsxToJson
);

module.exports = router;
