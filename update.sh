#!/bin/bash

# Function to log error and exit
log_and_exit() {
    echo "Error: $1" >&2
    echo "Logging error and exiting."
    exit 1
}

# Stop the server
sudo launchctl unload /Library/LaunchDaemons/com.clarity.webhook.plist || log_and_exit "Unable to stop the server."

# Wait for a moment and check if the server has stopped
sleep 5
if curl -X GET http://localhost:4040 | grep -q "Hey good lookin’"; then
    log_and_exit "Server is still running after attempting to stop."
fi

# Change to the directory of your repository
cd /Users/server/node/nodeServer || log_and_exit "Unable to change directory to /Users/server/node/"

# Execute a git pull
git pull || log_and_exit "Git pull failed."

# Remove node_modules and run npm install
rm -rf node_modules || log_and_exit "Unable to remove node_modules."
npm install || log_and_exit "npm install failed."

# Restart the server
sudo launchctl load /Library/LaunchDaemons/com.clarity.webhook.plist || log_and_exit "Unable to restart the server."

# Wait for the server to start
sleep 5
if ! curl -X GET http://localhost:4040 | grep -q "Hey good lookin’"; then
    log_and_exit "Server did not start properly after restart."
fi

echo "Update and restart successful."
