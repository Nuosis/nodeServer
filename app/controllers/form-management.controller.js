const { HttpStatusCode } = require("axios");
const { tokenize, deTokenize } = require("../../auth/security");

exports.tokenize = async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} /tokenize called`);
    data = req.body;
    console.log(data);
    const token = tokenize(data); // Implement this function to generate a unique token
    res.send({ token }); // Send back the token to the client
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).json({ error });
  }
};

exports.getTokenData = async (req, res) => {
  try {
    console.log(`${new Date().toISOString()} /deTokenize called`);
    const { token } = req.query;
    const data = deTokenize(token);
    res.send(data || {});
  } catch (error) {
    res
      .status(HttpStatusCode.InternalServerError)
      .json({ error: error.message });
  }
};
