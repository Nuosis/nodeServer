require('dotenv').config();
const { verifyToken, sanitizeInput, generateToken, hashPassword } = require('../auth/security');
const { createCompany, createUser } = require('../users/functions');
const { findRecordsSQL, modifyWhereSQL } = require('../SQLite/functions');
const { sendSMS } = require('../twilio/sms');

module.exports = function (app) {
    
    // Company Creation Endpoint
    /**
     * @params {company, DEVun, DEVpw}
     * @returns (message '{message, company, apiKey} or {error}')
     */
    // dev only !!!
    app.post('/createCompany', (req, res) => {
        console.log('create called');
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

    /**
     * @params {}
     */
    app.get('/companyUsers', verifyToken, async (req, res) => {
        console.log('/companyUsers')
        try {
            const username = req.user.userName
            const apiKey = req.user.apiKey
            const companyId = req.user.companyId
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


   // user creation endpoint
    /**
    * @params (username, password, apiKey, newUserName, newPassword, accessLevel)
    *       userName & password of authorized user (must be admin or dev credentials)
    *       apiKey of new user's company
    *       accessLevel of new user. If unsupplied set to standard
    * 
    * @returns (user info)
    */
   // super user or greater (admin or dev) 
    app.post('/createUser', verifyToken, async (req, res) => {
        console.log(`${new Date().toISOString()} /createUser`)
        const { apiKey, userName, userAccess } = req.user;
        const { newUserName, newPassword, accessLevel } = req.body;
        if (!newUserName || !newPassword) {
            return res.status(400).json({ message: 'userName, password for new user are required' });
        }
    
        if (newUserName.length > 32 || newPassword.length > 32) {
            return res.status(400).json({ message: 'userName or password too long' });
        }
        if (userName === process.env.DEVun && password === process.env.DEVpw) {
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

            //creators access level
            if (userAccess !== 'admin' && userAccess !== 'dev') {
                console.error('access error: Insufficient Access Level', userAccess);
                return res.status(400).json({ message: 'Insufficient credentials to create user' });
            }

            //creators intented access level for new useraccess level
            if (accessLevel ==='dev') {
                console.error('access error: Admin users cannot create dev users');
                return res.status(400).json({ message: 'Insufficient credentials to create dev user' })
            }

        
            //CREATE
            const newUserAccess = accessLevel || 'standard';
            console.log('accessLevel: ', newUserAccess);
            try {
                    // Call the createUser function
                    const newUser = await createUser(apiKey, newUserName, newPassword, newUserAccess);
                    res.status(201).json({ 
                        message: 'User created successfully. Provide user with the user name and password you provided. They will be asked to reset it on their initial log in',
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

    // user update endpoint
    /**
     * @params (newPassword, newAccessLevel, newReset)
     *       apiKey: API key of the user's company decoded from token
     *       username: Username of the user to update decoded from token
     *       newPassword: New password for the user (optional)
     *       newAccessLevel: New access level for the user (optional) 
     *       newReset: Change reset password for the user (optional) 
     * 
     * @returns (confirmation message)
     */
    app.post('/updateUser', verifyToken, async (req, res) => {
        console.log('/updateUser');
        const { apiKey, username, userId } = req.user;
        console.log('requestUser: ',req.user)
        const { newPassword, newAccessLevel, newReset } = req.body;

        // Basic validation
        if (!newPassword || !newAccessLevel || !newReset) {
            return res.status(400).json({ message: 'no updated values provided' });
        }

        try {
            // Confirm the user making the request has sufficient privileges
            
            const requesterInfo = await findRecordsSQL('users', [{ userId }]);
            if (userId !== 'dev' || requesterInfo.access !== 'admin') {
                console.error("access denied: access level",requesterInfo.access,'devUser',userId)
                return res.status(403).json({ message: 'Insufficient privileges' });
            }

            // Prepare modifications for updateUser function
            const modifications = [];
            if (newPassword) {
                const hashedPassword = await hashPassword(newPassword);
                modifications.push({ field: 'password', setTo: hashedPassword });
            }
            if (newAccessLevel) {
                modifications.push({ field: 'access', setTo: newAccessLevel });
            }
            if (newReset) {
                modifications.push({ field: 'resetPassword', setTo: newReset });
            }

            // Update user details in the database
            await modifyWhereSQL('users', [{ userId }], modifications);
            console.log('User updated successfully.');
            res.status(200).json({ message: 'User updated successfully' });
        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ message: error.message });
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