require('dotenv').config();
const { verifyPassword, hashPassword } = require('../auth/security');
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
    * @params (username, password, apiKey, accessLevel)
    *       userName & password of authorized user (must be admin or dev credentials)
    *       apiKey or new user's company
    *       accessLevel of new user. If unsupplied set to standard
    * 
    * @returns (user info)
    */
   // super user or greater (admin or dev) 
    app.post('/createUser', async (req, res) => {
        const { username, password, apiKey, newUserName, newPassword, accessLevel } = req.body;
        if (!username || !password || !apiKey|| !newUserName || !newPassword) {
            return res.status(400).json({ message: 'username, password and apiKey are required' });
        }
    
        if (username.length > 32 || password.length > 32) {
            return res.status(400).json({ message: 'Username or password too long' });
        }
        if (username === process.env.DEVun && password === process.env.DEVpw) {
            console.log('dev auth initiated') 
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
        }
        
        //CREATE
        const newUserAccess = accessLevel || 'standard';
        try {
                // Call the createUser function
                const newUser = await createUser(apiKey, newUserName, newPassword, newUserAccess);
                res.status(201).json({ 
                    message: 'User created successfully. Provide user with the username and password you provided. They will be asked to reset it on their initial log in', 
                    user: { id: newUser.id, username: newUser.username }
                });
        } catch (error) {
                console.error('Creation error:', error);
                res.status(500).json({ message: 'Error in user creation' });
        }
    });
    /*
    curl -X POST http://localhost:4040/createUser \
    -H "Content-Type: application/json" \
    -d '{"username": "test@example.com", "password": "yourpassword"}'
    */
};