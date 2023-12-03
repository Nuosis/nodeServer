require('dotenv').config();
const { verifyToken, verifyPassword } = require('../auth/security');
const { createRecordSQL, findRecordsSQL } = require('../SQLite/functions');
const { createUser, createCompany } = require('../users/functions');

module.exports = function (app) {

    // Company Creation Endpoint
    app.post('/createComapny', async (req, res) => {
        try {
                const { company, DEVun, DEVpw } = req.body;
                if (!company || !DEVun || !DEVpw) {
                    return res.status(400).json({ message: 'company, Username and password are required' });
                }

                // Optionally, add more validation for username and password here
                // Check if username and password are within the length limit
                if (company.length > 50 ) {
                    return res.status(400).json({ message: 'comapny, username or password appear invalid' });
                }
                //verify dev
                if (DEVun !== process.env.DEVun || DEVpw !== process.env.DEVpw) {
                    return res.status(400).json({ message: 'comapny, username or password appear invalid' });
                }
                // Call the createUser function
                const newUser = await createCompany(company);

                res.status(201).json({ 
                    message: 'User created successfully', 
                    user: { apiKey: newUser.apiKey }
                });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ message: 'Error in user registration' });
        }
    });
    /*
    curl -X POST http://localhost:4040/createCompany \
    -H "Content-Type: application/json" \
    -d '{"company": "ACME Co","username": "test@example.com", "password": "yourpassword"}'
    */


    // Registration endpoint
    app.post('/register', async (req, res) => {
        try {
                const { company, username, password } = req.body;
                if (!company || !username || !password) {
                    return res.status(400).json({ message: 'company, Username and password are required' });
                }

                // Optionally, add more validation for username and password here
                // Check if username and password are within the length limit
                if (username.company > 50 || username.length > 32 || password.length > 32) {
                    return res.status(400).json({ message: 'comapny, username or password appear invalid' });
                }
                // Call the createUser function
                const newUser = await createUser(company, username, password);

                res.status(201).json({ 
                    message: 'User created successfully', 
                    user: { id: newUser.id, username: newUser.username, apiKey: newUser.apiKey }
                });
            } catch (error) {
                console.error('Registration error:', error);
                res.status(500).json({ message: 'Error in user registration' });
        }
    });
    /*
    curl -X POST http://localhost:4040/register \
    -H "Content-Type: application/json" \
    -d '{"username": "test@example.com", "password": "yourpassword"}'
    */
    
    // Email Verification endpoint
    app.get('/email_verification', verifyToken, (req, res) => {
        const apiKey = req.user.apiKey;
        findRecordsSQL('users', [{ apiKey: apiKey }])
        .then(records => {
            if (records.length > 0) {
            // If records are found
            modifyAll('users', [{ apiKey: apiKey }], { verified: 1 })
                .then(() => {
                // Modification successful, return success response
                res.status(200).json({ message: 'Email verified successfully', records: records });
                })
                .catch(err => {
                // Error in modification, return an error response
                res.status(500).json({ message: 'Error in modifying records', error: err });
                });
            } else {
            // If no records are found, return a not found response
            res.status(404).json({ message: 'No records found' });
            }
        })
        .catch(err => {
            // If there's an error in finding records, return an error response
            res.status(403).json({ message: 'Error in accessing records', error: err });
        });
    });
};