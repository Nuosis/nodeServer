require('dotenv').config();
const { exec } = require('child_process');
const { generateToken, generateApiKey,verifyPassword, validateGitHubRequest } = require('../auth/security');
const { findRecordsSQL } = require('../SQLite/functions');
const { sendSMS } = require('../twilio/sms');

const gitHubSecret = process.env.GITHUB; // Make sure this is defined in your .env file
if (!gitHubSecret) {
    throw new Error('Required environmental variable GITHUB is undefined');
}
/**
 * @param {userName, password, company} app //required in body
 * if dev credentials passed, returns company info (or generates generic apiKey) as well as dev token
 * 
 * @returns {apiKey, token}
 */
module.exports = function (app, express) {
    app.post('/login', async (req, res) => {
        console.log(`${new Date().toISOString()} /login`);
        const { username, password, company } = req.body;
    
        // Validate username and password
        if (!username || !password) {
            console.log("username or password not passed")
            return res.status(400).json({ message: 'Username and password are required' });
        }
    
        if (username.length > 32 || password.length > 32) {
            console.log("username or password invalid")
            return res.status(400).json({ message: 'Username or password too long' });
        }
    
        // Check developer credentials
        if (username === process.env.DEVun && password === process.env.DEVpw) {
            console.log('dev auth initiated')
            // Handle company logic
            if (company) {
                const query = [{ company: company }];
                findRecordsSQL('company', query)
                    .then(records => {
                        console.log('records returned', JSON.stringify(records, null, 2));
                        if (records.length > 0) {
                            // Company exists, extract apiKey and generate dev token
                            console.log('company found')
                            const apiKey = records[0].apiKey; 
                            const token = generateToken(apiKey,process.env.DEVun,'dev');
                            return res.status(200).json({ apiKey, token, userAccess: "dev" });
                        } else {
                            console.log('company not found')
                            // Company does not exist, generate new API key
                            const newApiKey = generateApiKey();
                            const token = generateToken(newApiKey,process.env.DEVun,'dev');
                            return res.status(200).json({ apiKey: null, token: token, userAccess: "dev" });
                        }
                    })
                    .catch(err => {
                        console.error('Error finding records:', err);
                        return res.status(500).json({ message: 'Internal server error' });
                    });
            } else {
                // No company provided, just generate token
                const apiKey = generateApiKey()
                const token = generateToken(apiKey,process.env.DEVun,'dev');
                // userAccess, userReset, company: re
                return res.status(200).json({ apiKey: null, token, userAccess: "dev" });
            }
        } else {
            // Authenticate user
            console.log('user auth initiated')
            const userQuery = [{ username: username }];
            const userRecords = await findRecordsSQL('users', userQuery);

            if (userRecords.length === 0) {
                console.log(`no user found for user ${username}`)
                return res.status(404).json({ message: 'User not found' });
            }

            const userRecord = userRecords[0];

            // Verify password
            console.log(`verifying user ${JSON.stringify(userRecord)}`)
            const passwordVerified = await verifyPassword(password, userRecord.password);
            if (!passwordVerified) {
                console.log(`password failed`)
                return res.status(401).json({ message: 'Invalid password' });
            }
            const userAccess = userRecord.access;
            const userReset = userRecord.resetPassword;

            // Get company API key
            const companyQuery = [{ id: userRecord.companyId }];
            const companyRecords = await findRecordsSQL('company', companyQuery);

            if (companyRecords.length === 0) {
                console.log(`unable to find user's company`)
                return res.status(404).json({ message: 'Company associated with user not found' });
            }

            apiKey = companyRecords[0].apiKey;
            retreivedCompanyName = companyRecords[0].company;
            const token = generateToken(apiKey,username,userRecords[0].access);
            return res.status(200).json({ apiKey, token, userAccess, userReset, company: retreivedCompanyName });
        }
    });    

    app.post('/github-webhook', express.json(), (req, res) => {
        const secret = process.env.GITHUB; // Replace with your GitHub webhook secret
        const signature = req.headers['x-hub-signature'];
    
        // Validate the request
        if (!validateGitHubRequest(req.body, signature, secret)) {
            return res.status(401).send('Invalid signature');
        }
    
        // Absolute path to your shell script
        const scriptPath = '/Users/server/node/nodeServer/update.sh';
    
        // Execute the shell script
        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                sendSMS(process.env.DEV_NUMBER, `Update Failed: ${error.message}`)
                return res.status(500).send(`Script execution failed: ${error.message}`);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            sendSMS(process.env.DEV_NUMBER, `GitHub Webhook received and processed`)
            res.status(200).send('Webhook received and processed');
        });
    });
    
    
};
