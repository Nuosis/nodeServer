require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const jwt = require('jsonwebtoken');
const { getFileMakerToken, releaseFileMakerToken } = require('./dataAPI/access');
// const { verifyToken } = require('./auth/generateApiKey.js');
const { createRecord, findRecord, editRecord, deleteRecord, duplicateRecord } = require('./dataAPI/functions');
// https://server.selectjanitorial.com/fmi/data/apidoc/#tag/records (to query parameters)
const { exec } = require('child_process');

const authPrivateKey = process.env.SECRETKEY;
console.log('privateKey:',authPrivateKey)
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
function verifyToken(req, res, next) {
  // Get auth header value
  const bearerHeader = req.headers['authorization'];
  // console.log('privateKey:',authPrivateKey, "bearerHeader:",bearerHeader)
  // Check if bearer is undefined
  if (typeof bearerHeader !== 'undefined') {
    // Split at the space to get token
    const bearer = bearerHeader.split(' ');
    // Get token from array
    const bearerToken = bearer[1];
    // Verify the token
    jwt.verify(bearerToken, authPrivateKey, (err, authData) => {
      if (err) {
        res.sendStatus(403); // Forbidden
      } else {
        // Next middleware
        next();
      }
    });
  } else {
    // Forbidden
    res.sendStatus(403);
  }
}


/*
EXAMPLE OF HOW TO ADD AUTHENTICATION TO ENDPOINT
app.post('/prm/twilio', verifyToken, async (req, res) => {
  <<code>>
});
*/

// VERIFICATION END POINT
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
// //convert-xlsx-to-json
app.post('/convert-xlsx-to-json', (req, res) => {
  const { fileUrl, formName } = req.body;

  // Provide the correct relative path to your Python script
  const scriptPath = '/Users/server/node/venv/bin/python3';
  const scriptFile = '/Users/server/node/XLSX_to_JSON/xlsx_to_json.py';
  const command = `"${scriptPath}" "${scriptFile}" "${fileUrl}" "${formName}"`;

  exec(command, (error, stdout, stderr) => {
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