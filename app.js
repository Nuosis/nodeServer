require('dotenv').config();
const https = require('https');
const fs = require('fs');
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const validator = require('validator');
const sqlite3 = require('sqlite3').verbose();
const { readSSLFile } = require('./auth/security');

// Require the endpoint modules
const basicEndpoint = require('./endpoints/basic');
const access = require('./endpoints/access');
const jsonConversions = require('./endpoints/jsonConversion');
const fileManager = require('./endpoints/fileManagement');
const prm = require('./endpoints/prm');
const registration = require('./endpoints/registration');
const logs = require('./endpoints/logging');
const userManagement = require('./endpoints/userManagement');
const { sendSMS } = require('./twilio/sms');

const corsOptions = {
  origin: ['http://localhost:1234', 'http://localhost:4040', 'https://devtools.claritybusinesssolutions.ca'], // or '*' for allowing any origin
  methods: 'GET,POST', // Allowed methods
  allowedHeaders: 'Content-Type,Authorization', // Allowed headers
};

console.log("v.1.0.0")


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));



try {
  // DEFINE VARIABLES
  const authPrivateKey = process.env.SECRETKEY;
  if (!authPrivateKey) {
    throw new Error('Required environmental variable authPrivateKey is undefined');
  }
  const host = process.env.DEVhost;
  if (!host) {
    throw new Error('Required environmental variable host is undefined');
  }

  const httpsOptions = {
    key: readSSLFile('/etc/letsencrypt/live/server.claritybusinesssolutions.ca/privkey.pem'),
    cert: readSSLFile('/etc/letsencrypt/live/server.claritybusinesssolutions.ca/fullchain.pem')
  };


  if (!httpsOptions.key || !httpsOptions.cert) {
    // Start server without SSL for local testing
    app.listen(process.env.PORT || 4040, () => {
      console.log(`[${new Date().toISOString()}] Server is running on port ${process.env.PORT || 4040} without SSL`);
    });
  } else {
    // Start HTTPS server
    https.createServer(httpsOptions, app).listen(4343, () => {
      console.log(`[${new Date().toISOString()}] SSL Server is running on port 4343`);
    });

    // Start server without SSL for local testing
    app.listen(process.env.PORT || 4040, () => {
      console.log(`[${new Date().toISOString()}] Server is running on port ${process.env.PORT || 4040} without SSL`);
    });
  }
} catch (error) {
  sendSMS(process.env.DEV_NUMBER, `Server start-up error: ${error.message}`);
  console.error(`Server start-up error: ${error.message}`);
}

//ENDPOINT FILES
basicEndpoint(app);
access(app, express);
jsonConversions(app);
fileManager(app);
prm(app);
registration(app);
logs(app);
userManagement(app);

