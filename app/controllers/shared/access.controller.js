require("dotenv").config();
const { exec } = require("child_process");
const {
  generateToken,
  generateApiKey,
  verifyPassword,
  validateGitHubRequest,
  generateRefreshToken,
} = require("../../auth/security");
const { findRecordsSQL, createRecordSQL } = require("../../SQLite/functions");
const { sendSMS } = require("../../integrations/twilio/twilio");
const { Token } = require("../../models/Token");

function accessController() {
  this.login = async function (req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    try {
      const userQuery = [{ email }]
      const userRecords = await findRecordsSQL("users", userQuery);

      if (userRecords.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const userRecord = userRecords[0];

      // Verify password
      const passwordVerified = await verifyPassword(
        password,
        userRecord.password
      );
      if (!passwordVerified) {
        return res.status(401).json({ message: "Invalid password" });
      }
      const userAccess = userRecord.access;
      const userReset = userRecord.resetPassword;
      const filemakerId = userRecord.filemakerId;
      const userId = userRecord.id;
      const username = userRecord.username;

      const token = generateToken(
        userId,
        username,
        userAccess,
        email
      );
      const accessTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

      await createRecordSQL("token", {
        userId: userId,
        token: token,
        expiryTime: accessTokenExpiry,
        tokenType: "access",
      });

      return res
        .status(200)
        .json({
          token,
          userReset,
          username,
          userAccess,
          filemakerId,
          email,
        });
    } catch (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
  };

  this.verifyUser = async function (req, res) {
    try {
      const records = await findRecordsSQL("users", [{ id: req.user.userId }]);
      if (records.length > 0) {
        const data = { fileMakerId: records[0].fileMakerId };
        res.status(200).json(data);
      } else {
        console.error("No user records found");
        res.status(404).json({ error: "User record not found" });
      }
    } catch (err) {
      console.error("Error finding user records:", err);
      res.status(500).json({ error: "Unable to get data" });
    }
  };

  this.githubWebhook = function (req, res) {
    const secret = process.env.GITHUB;
    const signature = req.headers["x-hub-signature"];

    // Validate the request
    if (!validateGitHubRequest(req.body, signature, secret)) {
      return res.status(401).send("Invalid signature");
    }

    // Absolute path to your shell script
    const scriptPath = "/Users/server/node/nodeServer/update.sh";

    // Execute the shell script
    exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        sendSMS(process.env.DEV_NUMBER, `Update Failed: ${error.message}`);
        return res
          .status(500)
          .send(`Script execution failed: ${error.message}`);
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      sendSMS(process.env.DEV_NUMBER, `GitHub Webhook received and processed`);
      res.status(200).send("Webhook received and processed");
    });
  };
}

module.exports = new accessController();