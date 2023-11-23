require('dotenv').config();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authPrivateKey = process.env.SECRETKEY; // Make sure this is defined in your .env file
console.log('privateKey:',authPrivateKey)

// Function to generate an API key
function generateApiKey(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Function to verify the token
function verifyToken(token) {
  try {
    // Use the same key for verification if using HS256
    const decoded = jwt.verify(token, authPrivateKey);
    return decoded;
  } catch (err) {
    console.error('Invalid or expired token:', err.message);
    return null;
  }
}

// Generate and display the API key
const apiKey = generateApiKey();

// Sign the API key
const token = jwt.sign({ apiKey: apiKey }, authPrivateKey, { algorithm: 'HS256' });

// Verify the token
const verified = verifyToken(token);
if (verified) {
  console.log('Token Verified');
} else {
  console.log('Verification failed.');
}

console.log('API Key:', apiKey);
console.log('Public Key', token);
return {'apiKey':apiKey, 'publicaKey':token}