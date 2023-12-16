require('dotenv').config();
const { verifyToken } = require('../auth/security');
const { createCompany, createUser } = require('../users/functions');
const { findRecordsSQL } = require('../SQLite/functions');

module.exports = function (app) {
    
    // Company Creation Endpoint
    // dev only
    app.post('/createCompany', (req, res) => {
        const { company, DEVun, DEVpw } = req.body;
    
        if (!company || !DEVun || !DEVpw) {
            return res.status(400).json({ message: 'Company, username, and password are required' });
        }
    
        if (company.length > 50) {
            return res.status(400).json({ message: 'Company name too long' });
        }
    
        if (DEVun !== process.env.DEVun || DEVpw !== process.env.DEVpw) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
    
        // Check if the company already exists
        findRecordsSQL('company', [{ company: company }])
        .then(records => {
            if (records.length > 0) {
                // Company already exists, generate access token
                console.log('Company exists, generating token');
                const tokenRequestData = {
                    company: company,
                    username: process.env.DEVun,
                    password: process.env.DEVpw
                };
                return fetch('http://localhost:4040/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(tokenRequestData)
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to generate token');
                    }
                    return response.json();
                })
                .then(tokenData => ({ type: 'token', data: tokenData }));
            } else {
                // Create the new company
                console.log('Company creation STARTED');
                return createCompany(company)
                    .then(companyData => ({ type: 'company', data: companyData }));
            }
        })
        .then(result => {
            if (result.type === 'token') {
                // Handle the token generation result
                res.status(200).json({
                    message: 'Token generated successfully',
                    company: company,
                    token: result.data.token
                });
            } else if (result.type === 'company') {
                // Handle the new company creation result
                res.status(201).json({
                    message: 'Company created successfully', 
                    company: result.data.company,
                    token: result.data.token,
                    apiKey: result.data.apiKey
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ message: error.message });
        });

    });
    
    /*
    curl -X POST http://localhost:4040/createCompany \
    -H "Content-Type: application/json" \
    -d '{"company": "ACME Co","username": "test@example.com", "password": "yourpassword"}'
    */


   // user creation endpoint
   // super user or greater 
    app.post('/createUser', verifyToken, async (req, res) => {

        const { username, password, accessLevel  } = req.body;
        if (!username || !password ) {
            return res.status(400).json({ message: 'username and password are required' });
        }
        const newUserAccess = accessLevel || 'standard';
        //access level
        const { access } = req.user
        if (access == 'standard') {
            return res.status(400).json({ message: 'Insufficient access level to create user' });
        }
        const { apiKey } = req.user
        
        // Check if username and password are within the length limit
        if (username.company > 50 || username.length > 32 || password.length > 322 || DEVun.length > 32 || DEVpw.length > 32) {
            return res.status(400).json({ message: 'comapny, username and/or password error' });
        }
        try {
                // Call the createUser function
                const newUser = await createUser(apiKey, username, password, newUserAccess);
                res.status(201).json({ 
                    message: 'User created successfully', 
                    user: { id: newUser.id, username: newUser.username }
                });
        } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ message: 'Error in user registration' });
        }
    });
    /*
    curl -X POST http://localhost:4040/createUser \
    -H "Content-Type: application/json" \
    -d '{"username": "test@example.com", "password": "yourpassword"}'
    */
};