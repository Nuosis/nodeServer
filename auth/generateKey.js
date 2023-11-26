require('dotenv').config({ path: '/Users/marcusswift/Node/.env' });
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authPrivateKey = process.env.SECRETKEY; // Make sure this is defined in your .env file
if (!authPrivateKey) {
  throw new Error('Required environmental variable SECRETKEY is undefined');
}

// Function to generate a token from an apiKey
function generateToken(apiKey) {
    // Sign the API key
    const token = jwt.sign({ apiKey: apiKey }, authPrivateKey, { algorithm: 'HS256' });
    return token
}

// Function to generate an API key
function generateApiKey(length = 32) {
    const apiKey = crypto.randomBytes(length).toString('hex');

    // Sign the API key
    const token = generateToken(apiKey)
    return {'apiKey':apiKey, 'token':token}
}

const newKeys= generateApiKey()
console.log(newKeys)