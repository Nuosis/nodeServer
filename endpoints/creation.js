require('dotenv').config();
const { createCompany, createUser } = require('../users/functions');

module.exports = function (app) {
    
    // Company Creation Endpoint
    app.post('/createCompany', async (req, res) => {
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
                console.log('comapny creation STARTED')
                const newCompany = await createCompany(company);

                res.status(201).json({ 
                    message: 'Company created successfully', 
                    user: { apiKey: newCompany.apiKey }
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


   // user creation endpoint
    app.post('/createUser', async (req, res) => {
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