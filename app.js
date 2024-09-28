require("dotenv").config();
const https = require("https");
const fs = require("fs");
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const validator = require("validator");
const sqlite3 = require("sqlite3").verbose();
const { readSSLFile } = require("./auth/security");
const setupWebSocketServer = require("./webServices/websocket");

// Require the endpoint modules
const prm = require("./endpoints/prm");
const logs = require("./endpoints/logging");
const stripe = require("./endpoints/stripe");
const qbo = require("./endpoints/qbo");
const sequelize = require("./app/db");

const { sendSMS } = require("./app/integrations/twilio/twilio");

console.log(config.allowedOrigins);

const corsOptions = {
  origin: config.allowedOrigins, // or '*' for allowing any origin
  methods: ["GET", "POST"], // Allowed methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
};

// Sync the models with the database
sequelize
  .sync({ force: false }) // Set to 'true' if you want to drop tables before syncing
  .then(() => {
    console.log("Database connected and models synced.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

try {
  // DEFINE VARIABLES
  const authPrivateKey = process.env.SECRETKEY;
  if (!authPrivateKey) {
    throw new Error(
      "Required environmental variable authPrivateKey is undefined"
    );
  }
  const host = process.env.DEVhost;
  if (!host) {
    throw new Error("Required environmental variable host is undefined");
  }

  const httpsOptions = {
    // key: readSSLFile(
    //   "/etc/letsencrypt/live/server.claritybusinesssolutions.ca/privkey.pem"
    // ),
    // cert: readSSLFile(
    //   "/etc/letsencrypt/live/server.claritybusinesssolutions.ca/fullchain.pem"
    // ),
  };

  let server;

  if (!httpsOptions.key || !httpsOptions.cert) {
    // Start server without SSL for local testing
    server = app.listen(process.env.PORT || 4040, () => {
      console.log(
        `[${new Date().toISOString()}] Server is running on port ${
          process.env.PORT || 4040
        } without SSL`
      );
    });
  } else {
    // Start HTTPS server
    // server = https.createServer(httpsOptions, app).listen(4343, () => {
    //   console.log(`[${new Date().toISOString()}] SSL Server is running on port 4343`);
    // });

    // Start server without SSL for local testing
    app.listen(process.env.PORT || 4040, () => {
      console.log(
        `[${new Date().toISOString()}] Server is running on port ${
          process.env.PORT || 4040
        } without SSL`
      );
    });
  }

  // Setup WebSocket server
  setupWebSocketServer(server);

  var normalizedPath = require("path").join(__dirname, "/app/routes");
  require("fs")
    .readdirSync(normalizedPath)
    .forEach(function (file) {
      var route = require("./app/routes/" + file);
      if (route.configure != undefined) route.configure(app);
    });
} catch (error) {
  // sendSMS(process.env.DEV_NUMBER, `Server start-up error: ${error.message}`);
  console.error(`Server start-up error: ${error.message}`);
}

// Mount all routes from the specified router
app.use("/", [
  fileManagementRoutes,
  formManagementRoutes,
  jsonConversionRoutes,
]);

//ENDPOINT FILES
// basicEndpoint(app);
// access(app, express);
// jsonConversions(app);
// fileManager(app);
prm(app);
// registration(app);
logs(app);
// userManagement(app);
// clarityData(app);
// formManagement(app);
stripe(app);
qbo(app);
