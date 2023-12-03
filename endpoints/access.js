require('dotenv').config();
const { verifyPassword } = require('../auth/security');
const { createRecordSQL, findRecordsSQL } = require('../SQLite/functions');
const { generateToken } = require('../auth/generateKey');

module.exports = function (app) {
    // Endpoint to generate a token. AUTH is username+password.
    app.get('/generateToken', async (req, res) => {
        try {
            const { company, username, password } = req.body;
            if (!username || !password) {
                return res.status(400).json({ message: 'Username and password are required' });
            }

            if (username.length > 32 || password.length > 32) {
                return res.status(400).json({ message: 'Username or password appear invalid' });
            }

            if (username == process.env.DEVun && password == process.env.DENpw) {
                // apiKey based on comapny name
                if (!company) {
                    return res.status(400).json({ message: 'company name required' });
                }
                // Acquire company apiKey
                const companyQuery = [{ company: company }];
                const companyRecords = await findRecordsSQL('company', companyQuery);
                if (companyRecords.length === 0) {
                    return res.status(404).json({ message: 'Company not found' });
                }
                const company = companyRecords[0];
                const apiKey = company.apiKey;
                return {company,apiKey}

            } else {

                // Find user record based on username
                const userQuery = { username: username };
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
                // Acquire company apiKey
                const companyQuery = { id: userRecord.IdCompany };
                const companyRecords = await findRecordsSQL('company', companyQuery);
                if (companyRecords.length === 0) {
                    return res.status(404).json({ message: 'Company not found' });
                }
                const company = companyRecords[0];
                const apiKey = company.apiKey;
                return {company,apiKey}
            }

            // Generate Token
            const token = generateToken(apiKey);

            //Return Token
            res.json({ token: token });

        } catch (error) {
            console.error('Error in /generate-token:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });
};
