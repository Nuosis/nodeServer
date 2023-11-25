require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const authPrivateKey = process.env.SECRETKEY; // Make sure this is defined in your .env file
if (!authPrivateKey) {
  throw new Error('Required environmental variable SECRETKEY is undefined');
}

// Function to sanitize inputs
function sanitizeInput(input) {
  // Remove or escape potentially dangerous characters
  // This is a basic example, tailor it to your specific needs
  return input.replace(/[^a-zA-Z0-9-_\.]/g, "");
}

// Function to hash a password
async function hashPassword(password) {
  const saltRounds = 10; // or another appropriate number
  return bcrypt.hash(password, saltRounds);
}

// Function to verify a password against a hashed password
async function verifyPassword(password, hashedPassword) {
  return bcrypt.compare(password, hashedPassword);
}

// Function to verify the token and return the decoded payload
function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, authPrivateKey);
    // Return relevant information from the payload
    return {
      success: true,
      apiKey: decoded.apiKey
    };
  } catch (err) {
    console.error('Invalid or expired token:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
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

module.exports = {
  generateUUID: uuidv4, 
  generateApiKey, 
  generateToken,
  decodeToken,
  hashPassword,
  verifyPassword,
  sanitizeInput
};