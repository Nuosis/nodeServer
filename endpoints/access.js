require('dotenv').config();
const { generateApiKey,verifyPassword } = require('../auth/security');
const { findRecordsSQL } = require('../SQLite/functions');
const { generateToken } = require('../auth/generateKey');


module.exports = function (app) {
    app.post('/dev', (req, res) => {
        console.log('/dev');
        const { username, password, company } = req.body;
    
        // Validate username and password
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
    
        if (username.length > 32 || password.length > 32) {
            return res.status(400).json({ message: 'Username or password too long' });
        }
    
        // Check developer credentials
        if (username === process.env.DEVun && password === process.env.DEVpw) {
            // Handle company logic
            if (company) {
                const query = [{ company: company }];
                findRecordsSQL('company', query)
                    .then(records => {
                        if (records.length > 0) {
                            // Company exists, extract apiKey and generate token
                            const apiKey = records[0].apiKey; // Assuming apiKey is a field in your records
                            const token = generateToken(apiKey); // Implement generateToken function as needed
                            return res.status(200).json({ company, token });
                        } else {
                            // Company does not exist, generate new API key
                            const newApiKey = generateApiKey(); // Implement generateApiKey function as needed
                            return res.status(200).json({ company: null, token: newApiKey.token });
                        }
                    })
                    .catch(err => {
                        console.error('Error finding records:', err);
                        return res.status(500).json({ message: 'Internal server error' });
                    });
            } else {
                // No company provided, just generate token
                const token = generateToken(process.env.DEVun); // Or any other default token generation logic
                return res.status(200).json({ company: null, token });
            }
        } else {
            return res.status(404).json({ message: 'Denied' });
        }
    });    

    app.post('/generateToken', async (req, res) => {
        console.log('/generateToken')
        try {
            const { company, username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            if (username.length > 32 || password.length > 32) {
                return res.status(400).json({ message: 'Username or password too long' });
            }

            let apiKey;

            // Check if the username and password are for a developer
            if (username === process.env.DEVun && password === process.env.DEVpw) {
                console.log('dev process initiated')
                if (!company) {
                    return res.status(400).json({ message: 'Company name required for developer access' });
                }

                const companyQuery = [{ company: company }];
                const companyRecords = await findRecordsSQL('company', companyQuery);

                if (companyRecords.length === 0) {
                    return res.status(404).json({ message: 'Company not found' });
                }

                apiKey = companyRecords[0].apiKey;
            } else {
                // Authenticate regular user
                console.log('user process initiated')
                const userQuery = [{ username: username }];
                const userRecords = await findRecordsSQL('users', userQuery);

                if (userRecords.length === 0) {
                    return res.status(404).json({ message: 'User not found' });
                }

                const userRecord = userRecords[0];

                // Verify password
                const passwordVerified = await verifyPassword(password, userRecord.hashedPassword);
                if (!passwordVerified) {
                    return res.status(401).json({ message: 'Invalid password' });
                }

                // Get company API key
                const companyQuery = [{ id: userRecord.companyId }];
                const companyRecords = await findRecordsSQL('company', companyQuery);

                if (companyRecords.length === 0) {
                    return res.status(404).json({ message: 'Company associated with user not found' });
                }

                apiKey = companyRecords[0].apiKey;
            }

            // Generate Token
            const token = generateToken(apiKey);

            // Return Token
            res.json({ token: token });
        } catch (error) {
            console.error('Error in /generateToken:', error);
            // Send the specific error message to the client
            res.status(500).json({ message: error.message || 'Internal server error' });
        }
    });
};
