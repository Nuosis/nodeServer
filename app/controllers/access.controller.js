require('dotenv').config();
const { exec } = require('child_process');
const { generateToken, generateApiKey,verifyPassword, validateGitHubRequest, generateRefreshToken, } = require('../auth/security');
const { findRecordsSQL, createRecordSQL } = require('../../SQLite/functions');
const { sendSMS } = require('../integrations/twilio/twilio');
const { Token } = require('../models/Token');

function accessController() {
    
    this.login = async function (req, res) {
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
                console.error("dev error apiKey not passed on /login")
                return res.status(400).json({ message: 'dev error. this endpoint is missing required variable: apiKey' });
            }
            const coQuery = [{ apiKey }];
            const coRecords = await findRecordsSQL('company', coQuery);
            if (coRecords.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            const companyId = coRecords[0].id;
            const companyName = coRecords[0].company;

            const userQuery = [{ username, companyId }];
            const userRecords = await findRecordsSQL('users', userQuery);

            if (userRecords.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            const userRecord = userRecords[0];
            // console.log("userRecord Found: ",userRecord)

            // Verify password
            const passwordVerified = await verifyPassword(password, userRecord.password);
            if (!passwordVerified) {
                return res.status(401).json({ message: 'Invalid password' });
            }
            const userAccess = userRecord.access;
            const userReset = userRecord.resetPassword;
            const filemakerId = userRecord.filemakerId;
            const userId = userRecord.id;

            const token = generateToken(userId,username,userAccess,filemakerId,companyName)
            const refreshToken = generateRefreshToken(userId,username,userAccess,filemakerId,companyName);

            const accessTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes
            const refreshTokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

            await createRecordSQL('token', {
                userId: userId,
                token: token,
                expiryTime: accessTokenExpiry,
                tokenType: 'access',
            });

            await createRecordSQL('token', {
                userId: userId,
                token: refreshToken,
                expiryTime: refreshTokenExpiry,
                tokenType: 'refresh',
            });       

            return res.status(200).json({ token,refreshToken,userReset,username,userAccess,filemakerId,companyName});
        }
    }

    this.verifyUser = async function (req, res) {
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
    }

    this.githubWebhook = function (req, res) {
        const secret = process.env.GITHUB;
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
    }

    this.refereshToken = async function (req, res) {
        const { refreshToken } = req.body;

        // Validate refresh token input
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token required' });
        }

        try {
            // Verify the refresh token
            const decoded = await new Promise((resolve, reject) => {
            jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, authData) => {
                if (err) {
                console.error('Refresh Token Verification Error:', err);
                reject(err);  // Token expired or invalid
                } else {
                resolve(authData);  // Token is valid, proceed with decoded data
                }
            });
            });

            // Find the refresh token in the database
            const tokenRecord = await findRecordsSQL('token', [{ token: refreshToken, tokenType: 'refresh' }]);

            if (!tokenRecord || Date.now() > tokenRecord.expiryTime) {
                // Refresh token is invalid or expired in the database
                return res.status(401).json({ message: 'Refresh token expired, please log in again' });
            }

            // Generate a new access token
            const newAccessToken = generateToken(decoded.userId, decoded.apiKey, decoded.userName, decoded.access)
            const newAccessTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutes

            // Update access token in the database
            await createRecordSQL('token', {
            userId: decoded.userId,
            token: newAccessToken,
            expiryTime: newAccessTokenExpiry,
            tokenType: 'access',
            });

            // Return the new access token
            res.status(200).json({ accessToken: newAccessToken });

        } catch (err) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

    }
}

module.exports = new accessController();