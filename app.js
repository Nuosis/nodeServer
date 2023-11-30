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
const { getFileMakerToken, releaseFileMakerToken } = require('./dataAPI/access');
// const { verifyToken } = require('./auth/generateApiKey.js');
const { createRecord, findRecord, editRecord, deleteRecord, duplicateRecord } = require('./dataAPI/functions');
// https://server.selectjanitorial.com/fmi/data/apidoc/#tag/records (to query parameters)
const { createRecordSQL, findRecordsSQL } = require('./SQLite/functions');
const { createUser } = require('./users/functions');
const { exec, execFile } = require('child_process');
const { verifyToken, sanitizeInput, readSSLFile } = require('./auth/security');

// Require the endpoint modules
const basicEndpoint = require('./endpoints/basic');
const jsonConversions = require('./endpoints/jsonConversion');
const fileManager = require('./endpoints/fileManagement');
const prm = require('./endpoints/prm');
const registration = require('./endpoints/registration');
const logs = require('./endpoints/logging');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());



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
    key: readSSLFile('/etc/letsencrypt/live/selectjanitorial.com/privkey.pem'),
    cert: readSSLFile('/etc/letsencrypt/live/selectjanitorial.com/fullchain.pem')
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

//ENDPOINT FILES
basicEndpoint(app);
jsonConversions(app);
fileManager(app);
prm(app);
registration(app);
logs(app);

