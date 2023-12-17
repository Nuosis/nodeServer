require('dotenv').config();
const { verifyToken, sanitizeInput, generateToken } = require('../auth/security');
const { createCompany, createUser } = require('../users/functions');
const { findRecordsSQL } = require('../SQLite/functions');

module.exports = function (app) {
    
    // Company Creation Endpoint
    /**
     * @params {company, un, pw}
     * @returns (message 'succes or no')
     */
    // dev only !!!
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
                // Company already exists, return company information
                console.log('Company exists');
                return { type: 'company', data: records[0] };
            } else {
                // Create the new company
                console.log('Company creation STARTED');
                return createCompany(company)
                    .then(companyData => ({ type: 'company', data: companyData }));
            }
        })
        .then(result => {
            if (result.type === 'company') {
                // Handle the company information result
                res.status(200).json({
                    message: 'Company processed successfully', 
                    company: result.data.company,
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
   /**
    * @params (username, password, apiKey, newUserName, newPassword, accessLevel)
    *       userName & password of authorized user (must be admin or dev credentials)
    *       apiKey or new user's company
    *       accessLevel of new user. If unsupplied set to standard
    * 
    * @returns (user info)
    */
   // super user or greater (admin or dev) 
    app.post('/createUser', async (req, res) => {
        console.log('/createUser');
        const { username, password, apiKey, newUserName, newPassword, accessLevel } = req.body;
        if (!username || !password || !apiKey|| !newUserName || !newPassword) {
            return res.status(400).json({ message: 'username, password and apiKey are required' });
        }
    
        if (username.length > 32 || password.length > 32) {
            return res.status(400).json({ message: 'Username or password too long' });
        }
        if (username === process.env.DEVun && password === process.env.DEVpw) {
            console.log('dev auth initiated') 

        
            //CREATE
            const newUserAccess = accessLevel || 'standard';
            console.log('access: ', newUserAccess);
            try {
                    // Call the createUser function
                    const reset = false;
                    const newUser = await createUser(apiKey, newUserName, newPassword, newUserAccess, reset);
                    res.status(201).json({ 
                        message: 'User created successfully.',
                    });
            } catch (error) {
                    console.error('Creation error:', error.message);
                    res.status(500).json({ message: error.message });
            };
        } else {       
            console.log('user auth initiated')
            const adminQuery = [{ username: username }];
            const adminRecords = await findRecordsSQL('users', adminQuery);
            if (adminRecords.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }

            //creators access level
            const access = adminRecords.access
            if (access != 'admin' || 'dev') {
                return res.status(400).json({ message: 'Insufficient access level to create user' });
            }

            if (accessLevel ==='dev') {
                return res.status(400).json({ message: 'Insufficient access level to create dev user' })
            }

        
            //CREATE
            const newUserAccess = accessLevel || 'standard';
            console.log('access: ', newUserAccess);
            try {
                    // Call the createUser function
                    const newUser = await createUser(apiKey, newUserName, newPassword, newUserAccess);
                    res.status(201).json({ 
                        message: 'User created successfully. Provide user with the username and password you provided. They will be asked to reset it on their initial log in',
                    });
            } catch (error) {
                    console.error('Creation error:', error.message);
                    res.status(500).json({ message: error.message });
            };
        }
    });
    /*
    curl -X POST http://localhost:4040/createUser \
    -H "Content-Type: application/json" \
    -d '{"username": "test@example.com", "password": "yourpassword"}'
    */

    /**
     * @params {}
     */
    app.get('/companyUsers', verifyToken, async (req, res) => {
        console.log('/companyUsers')
        try {
            const username = req.user.userName
            const apiKey = req.user.apiKey
            const query = [{ apiKey }];
            const company = await findRecordsSQL('company', query);
            if (company.length === 0) {
                return res.status(404).json({ message: 'apiKey invalid' });
            }
            const companyId = company[0].id
            const userQuery = [{ companyId }];
            const users = await findRecordsSQL('users', userQuery);
            if (users.length === 0) {
                return res.status(404).json({ message: 'no users found' });
            } else {
                const userArray = users.map(user => ({
                    username: user.username,
                    access: user.access
                }));
                return res.status(200).json({ 
                    message: 'users found',
                    userArray
                });
            }
        } catch (err) {
            // If there's an error in sending the email, return an error response
            res.status(500).json({ message: 'Error getting company users', error: err.message });
        }
    });

    app.post('/user_token', verifyToken, async (req, res) => {
        console.log('/user_token')
        try {
            const accessUserName = req.user.userName
            const accessAccessLevel = req.user.access
           
            if (accessUserName !== process.env.DEVun || accessAccessLevel !== "dev") {
                return res.status(400).json({ message: 'Invalid credentials' });
            }

            console.log('raw.username', req.body.username, 'raw.access', req.body.access)
            const username = sanitizeInput(req.body.username);
            if (!username || username.length < 3 || username.length > 30) {
                return res.status(400).json({ message: 'Invalid username' });
            }
            console.log('username', username)
            const access = sanitizeInput(req.body.access); 
            if (!access || typeof access !== 'string') {  // Adjust this according to what 'access' represents
                return res.status(400).json({ message: 'Invalid access level' });
            }    
            console.log('access', access)        
            const id = (await findRecordsSQL('users', [{username}]))[0].companyId;
            const apiKey = (await findRecordsSQL('company', [{id}]))[0].apiKey;
            console.log('apiKey', apiKey)
            const token = generateToken(apiKey, username, access)
            return res.status(200).json({ 
                message: 'token generated',
                token
            });

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    });
};