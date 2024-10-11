// Assuming the use of CommonJS syntax as in your provided code.
require("dotenv").config(); // Make sure to load environment variables
// const jwt = require("jsonwebtoken");

const authPrivateKey = "76fc83c3-08c1-4055-a869-fc1f12b12fcb"; //process.env.SECRETKEY; // Make sure this is defined in your .env file
if (!authPrivateKey) {
  throw new Error("Required environmental variable SECRETKEY is undefined");
}

// function generateResetPasswordToken(email) {
//   try {
//     const token = jwt.sign({ email }, authPrivateKey, {
//       algorithm: "HS256",
//       expiresIn: "15m",
//     });
//     return token;
//   } catch (error) {
//     console.error("Error generating refresh token:", error);
//     throw new Error("Token generation failed");
//   }
// }

module.exports = { generateResetPasswordToken };
