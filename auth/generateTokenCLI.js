// Assuming the use of CommonJS syntax as in your provided code.
require('dotenv').config(); // Make sure to load environment variables
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')


const authPrivateKey = "76fc83c3-08c1-4055-a869-fc1f12b12fcb"//process.env.SECRETKEY; // Make sure this is defined in your .env file
if (!authPrivateKey) {
    throw new Error('Required environmental variable SECRETKEY is undefined');
}

function generateToken(apiKey, userName, access) {
    try {
        const key = apiKey || '';
        const user = userName || '';
        const accessLevel = access || 'standard';
        // Sign the API key
        const token = jwt.sign({ apiKey: key, userName: user, access: accessLevel }, authPrivateKey, { algorithm: 'HS256' });
        return token;
    } catch (error) {
        console.error("Error generating token:", error);
        throw new Error("Token generation failed");
    }
}

const [apiKey, userName, access] = process.argv.slice(2);

// Validate command-line arguments
if (!apiKey || !userName) {
    console.error('Usage: node generateTokenCLI.js <apiKey> <userName> [<access>]');
    process.exit(1);
}

// Default access level to 'standard' if not provided
const accessLevel = access || 'standard';

try {
    const token = generateToken(apiKey, userName, accessLevel);
    console.log('Generated Token:', token);
} catch (error) {
    console.error('Error generating token:', error.message);
}
