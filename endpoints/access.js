require('dotenv').config();
const { exec } = require('child_process');
const { generateToken, generateApiKey,verifyPassword, validateGitHubRequest } = require('../auth/security');
const { findRecordsSQL } = require('../SQLite/functions');
const { sendSMS } = require('../twilio/sms');
const { verifyToken } = require('../auth/security');

const gitHubSecret = process.env.GITHUB; // Make sure this is defined in your .env file
if (!gitHubSecret) {
    throw new Error('Required environmental variable GITHUB is undefined');
}
/**
 * @param {userName, password, apiKey} app //required in body
 * if dev credentials passed, returns company info (or generates generic apiKey) as well as dev token
 * 
 * @returns {apiKey, token}
 */
module.exports = function (app, express) {
    app.post('/login', async (req, res) => {
        console.log(`${new Date().toISOString()} /login`);
        const { username, password, apiKey, company } = req.body;
    
        // Validate username and password
        if (!username || !password) {
            console.log("username or password not passed")
            return res.status(400).json({ message: 'Username and password are required' });
        }
    
        if (username.length > 120 || password.length > 120) {
            console.log("username or password invalid")
            return res.status(400).json({ message: 'Username or password too long' });
        }
    
    // Check developer credentials
    if (username === process.env.DEVun && password === process.env.DEVpw) {
        console.log('dev auth initiated');
        try {
            let query =[]
            if (apiKey) {
                query = [{ apiKey }];
            } else if (company) {
                query = [{ company }];
            } else {
                const newApiKey = generateApiKey();
                const token = generateToken(newApiKey, process.env.DEVun, 'dev');
                return res.status(200).json({ apiKey: null, token, userAccess: "dev" });
            }
            const records = await findRecordsSQL('company', query);
            // console.log('login: company records returned', JSON.stringify(records, null, 2));
            if (records.length > 0) {
                console.log('company found');
                const key = records[0].apiKey;
                const token = generateToken(key, process.env.DEVun, 'dev');
                return res.status(200).json({ apiKey: key, token, userAccess: "dev" })
            } else {
                console.log('company not found');
                const key = generateApiKey();
                const token = generateToken(key, process.env.DEVun, 'dev');
                return res.status(200).json({ apiKey: null, token, userAccess: "dev" })
            };
        } catch (err) {
            console.error('Error in dev authentication:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
            // Authenticate user
            console.log('user auth initiated')
            // Validate username and password
            if (!apiKey ) {
                console.log("dev error apiKey not passed")
                console.error("dev error apiKey not passed on /login")
                return res.status(400).json({ message: 'dev error. this endpoint is missing required variable: apiKey' });
            }
            const coQuery = [{ apiKey }];
            const coRecords = await findRecordsSQL('company', coQuery);
            if (coRecords.length === 0) {
                console.log(`no company found`)
                return res.status(404).json({ message: 'User not found' });
            }
            const companyId = coRecords[0].id;
            const companyName = coRecords[0].company;

            const userQuery = [{ username, companyId }];
            const userRecords = await findRecordsSQL('users', userQuery);

            if (userRecords.length === 0) {
                console.log(`no user found for user ${username}`)
                return res.status(404).json({ message: 'User not found' });
            }

            const userRecord = userRecords[0];
            // console.log("userRecord Found: ",userRecord)

            // Verify password
            const passwordVerified = await verifyPassword(password, userRecord.password);
            console.log(`password verified: `,passwordVerified)
            if (!passwordVerified) {
                console.log(`password failed`)
                return res.status(401).json({ message: 'Invalid password' });
            }
            const userAccess = userRecord.access;
            const userReset = userRecord.resetPassword;
            const filemakerId = userRecord.filemakerId;
            console.log(`generatedToken: `,filemakerId,userReset,userAccess)

            const token = generateToken(username,userAccess,filemakerId,companyName)
            console.log(`Token generated`)
            return res.status(200).json({ token,userReset,username,userAccess,filemakerId,companyName});
        }
    });   
    
    //req.user.userId
    app.get('/verify', verifyToken, async (req, res) => {
      try {
        const records = await findRecordsSQL('users', [{ id: req.user.userId }]);
        if (records.length > 0) {
          const data = { fileMakerId: records[0].fileMakerId };
          res.status(200).json(data);
        } else {
          console.error('No user records found');
          res.status(404).json({ error: "User record not found" });
        }
      } catch (err) {
        console.error('Error finding user records:', err);
        res.status(500).json({ error: "Unable to get data" });
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
                // sendSMS(process.env.DEV_NUMBER, `Update Failed: ${error.message}`)
                return res.status(500).send(`Script execution failed: ${error.message}`);
            }
            console.log(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            // sendSMS(process.env.DEV_NUMBER, `GitHub Webhook received and processed`)
            res.status(200).send('Webhook received and processed');
        });
    });
    
    
};
