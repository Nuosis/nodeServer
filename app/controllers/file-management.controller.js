const { HttpStatusCode } = require("axios");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const moveScript = path.join(__dirname, "../../", "moveSavedFile.sh");

if (!fs.existsSync(moveScript)) {
  throw new Error("Required moveFile script not initialized properly");
}

exports.movetoImages = async (req, res) => {
  try {
    const filePath = req.body.file;
    const debug = req.body.debug;

    if (!filePath) {
      return res.status(HttpStatusCode.BadRequest).send("No file path provided");
    }

    const { stdout, stderr } = exec(`"${moveScript}" "${filePath}" "${debug}"`);

    console.log(`stdout: ${stdout}`);
    if (stderr) {
      console.error(`stderr: ${stderr}`);
    }

    res.send("Script executed successfully");
  } catch (error) {
    res
      .status(HttpStatusCode.InternalServerError)
      .json({ error: error.message });
  }
};
