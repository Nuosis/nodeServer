const { verifyToken } = require('../auth/security');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const moveScript = path.join(__dirname, '..', 'moveSavedFile.sh');
if (!fs.existsSync(moveScript)) {
    throw new Error('Required moveFile script not initialized properly');
}

module.exports = function (app) {
    // Endpoint to move a saved file to webserver
    app.post('/moveToImages', verifyToken, (req, res) => {
        const filePath = req.body.file;
        const debug = req.body.debug;
        
        if (!filePath) {
            return res.status(400).send('No file path provided');
        }

        exec(`"${moveScript}" "${filePath}" "${debug}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return res.status(500).send('Script execution failed');
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            res.send('Script executed successfully');
        });
    });
    /*
    curl -X POST http://localhost:4040/moveToImages \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_TOKEN_HERE" \
    -d '{"file":"/path/to/your/file.pdf"}'
    */
};
