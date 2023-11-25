require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const jwt = require('jsonwebtoken');
const validator = require('validator');
const sqlite3 = require('sqlite3').verbose();
const { getFileMakerToken, releaseFileMakerToken } = require('./dataAPI/access');
// const { verifyToken } = require('./auth/generateApiKey.js');
const { createRecord, findRecord, editRecord, deleteRecord, duplicateRecord } = require('./dataAPI/functions');
// https://server.selectjanitorial.com/fmi/data/apidoc/#tag/records (to query parameters)
const { createRecordSQL, findRecordsSQL } = require('./SQLite/functions');
const { createUser } = require('./users/functions');
const { execFile } = require('child_process');

const authPrivateKey = process.env.SECRETKEY;
// console.log('privateKey:',authPrivateKey)
// const userName = process.env.DEVun;
// console.log('UserName:',userName)
// const password = process.env.DEVpw;
// console.log('password: ',password)
const host = process.env.DEVhost;
console.log('host:',host)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT || 4040, () => {
  console.log(`[${new Date().toISOString()}] Server is running on port ${process.env.PORT || 4040}`);
});

//AUTHENTICATION
async function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space to get token
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    
    try {
      // Verify the token
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(bearerToken, authPrivateKey, (err, authData) => {
          if (err) {
            reject(err);
          } else {
            resolve(authData);
          }
        });
      });
  
      // Attach decoded data to request object
      req.user = decoded;
  
      // Next middleware
      next();
    } catch (err) {
      res.sendStatus(403); // Forbidden
    }
  }
}

/*
EXAMPLE OF HOW TO ADD AUTHENTICATION TO ENDPOINT
app.post('/prm/twilio', verifyToken, async (req, res) => {
  <<code>>
});
*/

// Hello World END POINT
// /
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// VERIFICATION TOKEN END POINT
// /validate
app.get('/validate', verifyToken, (req, res) => {
  // If the token is valid, the request will reach here.
  // You can add additional checks or return user data if needed.
  res.status(200).json({ message: 'Access validated successfully' });
});

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
      const { username, password } = req.body;
      if (!username || !password) {
          return res.status(400).json({ message: 'Username and password are required' });
      }

      // Optionally, add more validation for username and password here
      // Check if username and password are within the length limit
      if (username.length > 32 || password.length > 32) {
          return res.status(400).json({ message: 'Username and password appear invalid' });
      }

      // Call the createUser function
      const newUser = await createUser(username, password);

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

// PRM/TWILIO END POINT
// /prm/twilio
app.post('/prm/twilio', async (req, res) => {
  // console.log("Incoming request: ", req);
  const server = host;
  const database = 'PRM';
  const username = process.env.PRMun;
  const password = process.env.PRMpw;
  const dataString = req.body;
  // Parse the 'data' string into a JavaScript object
  const incomingData = JSON.stringify(dataString);

  let token; // Declare token outside the try block
  
  
	/* GET FILEMAKER TOKEN */ 
  try {
    token = await getFileMakerToken(server, database, username, password);
    // console.log("Token:", token);
  } catch (error) {
    console.error("Error getting FileMaker token:", error);
    res.status(500).send("Error in getting FileMaker token");
    return; // Early return on error
  }
  
  
  
 	/* SET FILEMAKER RECORD */ 
  const params = {
  		// see https://server.selectjanitorial.com/fmi/data/apidoc/#tag/records/operation/create
        fieldData: {
          'queryParams':incomingData,
          'path':'twilio'
        },
        script: "web . process webhook" // Specify the script to run after record creation
  };
  const layout = 'devWebpayloads'
  
  try {
    const recordCreationResult = await createRecord(server, database, layout, token, params);
  } catch (error) {    
  	// Extracting meaningful error information
    const errorInfo = {
      status: error.response?.status || 500, // Use optional chaining to handle cases where response is undefined
      statusText: error.response?.statusText || "Internal Server Error",
      message: error.message,
      apiError: error.response?.data || "No additional error info" // Assuming the API error details are in error.response.data
    };

    console.error("Meaningful Error Info:", errorInfo);

    res.status(errorInfo.status).send({
      error: "Error in processing request",
      details: errorInfo
    });
    return;
    //console.error("Error creating record", error);
    //res.status(500).send("Error setting information");
  }    

  
  /* RELEASE FILEMAKER TOKEN */
  try {
    await releaseFileMakerToken(server, database, token);
  } catch (error) {
    console.error("Error releasing FileMaker token:", error);
    res.status(500).send("Error in releasing FileMaker token");
    return; // Early return on error
  }

  res.status(200).send('received and set');
});

// XLSX toJSON SERVICE

// Function to sanitize inputs
function sanitizeInput(input) {
  // Remove or escape potentially dangerous characters
  // This is a basic example, tailor it to your specific needs
  return input.replace(/[^a-zA-Z0-9-_\.]/g, "");
}
app.post('/convert-xlsx-to-json', (req, res) => {
  let { fileUrl, formName } = req.body;

  // Validate inputs
  if (!validator.isURL(fileUrl)) {
      return res.status(400).send('Invalid URL');
  }
  if (typeof formName !== 'string' || formName.trim().length === 0) {
      return res.status(400).send('Invalid form name');
  }

  // Sanitize inputs
  fileUrl = sanitizeInput(fileUrl);
  formName = sanitizeInput(formName);

  // Provide the correct relative path to your Python script
  const scriptPath = '/Users/server/node/venv/bin/python3';
  const scriptFile = '/Users/server/node/XLSX_to_JSON/xlsx_to_json.py';
  const command = `"${scriptPath}" "${scriptFile}" "${fileUrl}" "${formName}"`;

  execFile(command, (error, stdout, stderr) => {
    // Log stdout and stderr
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).send('Error executing Python script');
    }
    res.send(stdout);
  });
});

// Endpoint to move a saved file to webserver
app.get('/moveToImages', verifyToken, (req, res) => {
    const filePath = req.body.file;
    
    if (!filePath) {
        return res.status(400).send('No file path provided');
    }

    exec(`/Users/server/node/moveSavedFile.sh "${filePath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return res.status(500).send('Script execution failed');
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        res.send('Script executed successfully');
    });
});
/*

curl -X POST http://localhost:4040/moveToImages \
-H "Content-Type: application/json" \
-H "Authorization: Bearer YOUR_TOKEN_HERE" \
-d '{"file":"/path/to/your/file.pdf"}'


*/