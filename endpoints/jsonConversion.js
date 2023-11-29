const validator = require('validator');
const { execFile } = require('child_process');
const { sanitizeInput } = require('../auth/security');

module.exports = function (app) {
    // XLSX to JSON SERVICE
    app.post('/convert-xlsx-to-json', (req, res) => {
        let { fileUrl, formName } = req.body;

        // Validate inputs
        if (!validator.isURL(fileUrl)) {
            return res.status(400).send('Invalid URL');
        }
        if (typeof formName !== 'string' || formName.trim().length === 0) {
            return res.status(400).send('Invalid form name');
        }

        // Sanitize inputs
        fileUrl = sanitizeInput(fileUrl);
        formName = sanitizeInput(formName);

        // Provide the correct relative path to your Python script
        const scriptPath = '/Users/server/node/venv/bin/python3';
        const scriptFile = '/Users/server/node/XLSX_to_JSON/xlsx_to_json.py';
        const command = `"${scriptPath}" "${scriptFile}" "${fileUrl}" "${formName}"`;

        execFile(command, (error, stdout, stderr) => {
        // Log stdout and stderr
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Error executing Python script');
        }
        res.send(stdout);
        });
    });
};