require("dotenv").config();
const https = require("https");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
var morgan = require('morgan');
const config = require("./config/default.json");
const sequelize = require("./app/db");
const { readSSLFile } = require("./app/auth/security");
const { sendSMS } = require("./app/integrations/twilio/twilio");
const setupWebSocketServer = require("./app/webServices/websocket");
const path = require("path");
const setupSocketIO = require("./app/webServices/socketIO");

// Initialize the Express app
const app = express();

const corsOptions = {
  origin: config.allowedOrigins,
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(morgan('dev'));

// Sync the models with the database
sequelize
  .sync({ force: false }) // Set to 'true' if you want to drop tables before syncing
  .then(() => console.log("Database connected and models synced."))
  .catch((error) => console.error("Unable to connect to the database: ", error));

// Check required environment variables
const validateEnvVariables = () => {
  const requiredVariables = ["SECRETKEY", "DEVhost"];
  requiredVariables.forEach((variable) => {
    if (!process.env[variable]) {
      throw new Error(`Required environment variable ${variable} is undefined`);
    }
  });
};

try {
  validateEnvVariables();

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
    server = https.createServer(httpsOptions, app).listen(4343, () => {
      console.log(`[${new Date().toISOString()}] SSL Server is running on port 4343`);
    });
  }

  // Setup WebSocket server
  // setupWebSocketServer(server);
  setupSocketIO(server)

  const loadRoutes = (app, routesPath) => {
    fs.readdirSync(routesPath).forEach((file) => {
      const filePath = path.join(routesPath, file);
  
      // Check if it's a directory
      if (fs.lstatSync(filePath).isDirectory()) {
        // Recursively load files from the directory
        loadRoutes(app, filePath);
      } else {
        // Load the file if it's a JavaScript file
        if (file.endsWith(".js")) {
          console.log('Loading route file:', file);
          const route = require(filePath);
  
          // Check if the route has a `configure` function
          if (typeof route.configure === "function") {
            route.configure(app);
          }
        }
      }
    });
  };

  const routesPath = path.join(__dirname, "/app/routes");
  loadRoutes(app, routesPath);
  
} catch (error) {
  sendSMS(process.env.DEV_NUMBER, `Server start-up error: ${error.message}`);
  console.error(`Server start-up error: ${error.message}`);
  console.error(error.stack);  // This will print detailed error information with stack trace
}