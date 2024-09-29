const { HttpStatusCode } = require("axios");
const { tokenize, deTokenize } = require("../../auth/security");

function formManagementController() {
    
  this.tokenize = function (req, res) {
    try {
      data = req.body;
      const token = tokenize(data); // Implement this function to generate a unique token
      res.send({ token });
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ error: error.message });
    }
  }

  this.getTokenData = function (req, res) {
    try {
      const { token } = req.query;
      const data = deTokenize(token);
      res.send(data || {});
    } catch (error) {
      res.status(HttpStatusCode.InternalServerError).json({ error: error.message });
    }
  }

}

module.exports = new formManagementController();
