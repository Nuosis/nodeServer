require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const authPrivateKey = process.env.SECRETKEY; // Make sure this is defined in your .env file
// console.log('privateKey:',authPrivateKey)

// Function to verify the token
function decodeToken(token) {
  try {
    // Use the same key for verification if using HS256
    const decoded = jwt.verify(token, authPrivateKey);
    return decoded;
  } catch (err) {
    console.error('Invalid or expired token:', err.message);
    return null;
  }
}

// Function to generate an API key
function generateToken(apiKey) {

    // Sign the API key
    const token = jwt.sign({ apiKey: apiKey }, authPrivateKey, { algorithm: 'HS256' });

    // Verify the token
    const verified = decodeToken(token);

    if (verified) {
      return {'publicaKey':token};
    } else {
      return('Verification failed.');
    }
}

// Function to generate an API key
function generateApiKey(length = 32) {
    const apiKey = crypto.randomBytes(length).toString('hex');

    // Sign the API key
    const token = generateToken(apiKey)
    if (token !=='Verification failed.') {
      return {'apiKey':apiKey, 'publicaKey':token};
    } else {
      return('Verification failed.');
    }
}

module.exports = {
  generateUUID: uuidv4, 
  generateApiKey, 
  generateToken,
  decodeToken
};