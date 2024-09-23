require('dotenv').config();
const { verifyToken } = require('../auth/security');

module.exports = function (app) {
    // Hello World END POINT
    app.get('/', (req, res) => {
        res.send('Hey good lookin\'');
    });
    
    // Verify token 
    app.get('/validate', verifyToken, (req, res) => {
        // If the token is valid, the request will reach here.
        // You can add additional checks or return user data if needed.
        res.status(200).json({ message: 'Access validated successfully' });
    });
};