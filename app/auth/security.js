require('dotenv').config();
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const sqlite3 = require('sqlite3').verbose();
const { createRecordSQL, findRecordsSQL } = require('../../SQLite/functions');

const authPrivateKey = process.env.SECRETKEY; // Make sure this is defined in your .env file
if (!authPrivateKey) {
  throw new Error('Required environmental variable SECRETKEY is undefined');
}

// @returns {req.user{apiKey, userName, access}}
async function verifyToken(req, res, next) {
  const path = (req.path);
  // Get auth header value
  const bearerHeader = req.headers['authorization'] || req.headers['Authorization'] ;
  let decoded;

  if (typeof bearerHeader !== 'undefined') {
    // Split at the space to get token
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    
    try {
      // Verify the token
      decoded = await new Promise((resolve, reject) => {
        jwt.verify(bearerToken, authPrivateKey, (err, authData) => {
          if (err) {
            console.error('JWT Verification Error:', err);
            reject(err);
          } else {
            resolve(authData);
          }
        });
      });
      if(decoded.data && Object.keys(decoded.data).length>0){
        decoded=decoded.data
      }
      if (decoded?.apiKey) {
        await findRecordsSQL('company', [{ apiKey: decoded.apiKey }])
          .then(records => {
            decoded.companyId = records[0].id
            decoded.company = records[0].company
          })
          .catch(err => console.error('Error finding company records:', err));
      }
      
      if(decoded?.access !== 'dev'){
        if (decoded?.userName && decoded?.companyId) {
          await findRecordsSQL('users', [{ username: decoded.userName, companyId: decoded.companyId }])
            .then(records => {
              decoded.userId = records[0].id
            })
            .catch(err => console.error('Error finding user records:', err));
        }
      }

      // Attach decoded data to request object
      req.user = decoded;

      const tableName = 'userAccess';
      const recordID = uuidv4();
      const currentDate = new Date();
      // For the date field
      const sqliteDateFormat = currentDate.toISOString().split('T')[0]; // Formats to 'YYYY-MM-DD'
      // For the timestamp fields
      const sqliteTimestampFormat = currentDate.toISOString().replace('T', ' ').replace(/\.\d+Z$/, ''); // Formats to 'YYYY-MM-DD HH:MM:SS'
      const newAccess = {
        id: recordID,
        apiKey: decoded.apiKey,
        userId: decoded.userName === 'Dev' ? 'dev' : decoded.userId,
        userName: decoded.userName,
        endPoint: path,
        date: sqliteDateFormat,
        created: sqliteTimestampFormat,
        modified: sqliteTimestampFormat
      };

      createRecordSQL(tableName, newAccess)
        .then(lastID => {
        })
        .catch(error => {
          console.error('Failed to add new access record:', error);
      });
  
      // Next middleware
      next();
    } catch (err) {
      res.sendStatus(403); // Forbidden
    }
  } else {
    console.error('No authorization token/api key provided in request headers.');
    res.status(401).send('No token/key provided');
  } 
}


// Function to sanitize inputs
function sanitizeInput(input) {
  // Remove or escape potentially dangerous characters
  // This is a basic example, tailor it to your specific needs
  return input.replace(/[^a-zA-Z0-9-_\.]/g, "");
}

// Function to read and report SSL files
function readSSLFile(filePath) {
  try {
      return fs.readFileSync(filePath);
  } catch (err) {
      console.error(`Failed to load SSL file at ${filePath}: ${err.message}`);
      return null; // Return null instead of throwing an error
  }
}

// Function to hash a password
async function hashPassword(password) {
  const saltRounds = 10; // or another appropriate number
  return bcrypt.hash(password, saltRounds);
}

// Function to verify a password against a hashed password
async function verifyPassword(password, hashedPassword) {
  console.log(`compairing passwords`)
  return bcrypt.compare(password, hashedPassword);
}

// Function to verify the token and return the decoded payload
/**
 * 
 * @param {*} token 
 * @returns encoded contents of Token {apiKey, userName, access}
 *          access can be 'standard', 'admin', 'dev'
 */
function decodeToken(token) {
  try {
    const decoded = jwt.verify(token, authPrivateKey);
    // Return relevant information from the payload
    return {
      apiKey: decoded.apiKey,
      userName: decoded.userName,
      access: decoded.access
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

// Function to generate a token from an apiKey
function tokenize(data) {
  try {
      // Sign
      const token = jwt.sign({ data }, authPrivateKey, { algorithm: 'HS256' });
      return token;
  } catch (error) {
      console.error("Error generating token:", error);
      throw new Error("Token generation failed");
  }
}

function deTokenize(token) {
  try {
    const decoded = jwt.verify(token, authPrivateKey);
    // Return relevant information from the payload
    return {
      decoded
    };
  } catch (err) {
    console.error('Invalid or expired token:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

// Function to generate an API key
function generateApiKey(length = 32) {
    const apiKey = crypto.randomBytes(length).toString('hex');

    // Sign the API key
    // const token = generateToken(apiKey)
    return {apiKey: apiKey}
}

function validateGitHubRequest(body, signature, secret) {
  const hmac = crypto.createHmac('sha1', secret);
  const digest = 'sha1=' + hmac.update(JSON.stringify(body)).digest('hex');
  return signature === digest;
}

module.exports = {
  generateUUID: uuidv4, 
  generateApiKey, 
  generateToken,
  decodeToken,
  hashPassword,
  verifyPassword,
  verifyToken,
  sanitizeInput,
  readSSLFile,
  validateGitHubRequest,
  tokenize,
  deTokenize,
};