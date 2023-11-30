const { verifyToken, } = require('../auth/security');
const { createRecordSQL, findRecordsSQL } = require('../SQLite/functions');
const { v4: uuidv4 } = require('uuid');

module.exports = function (app) {
    
    // Log
    /**
     * Handles POST requests to log various types of messages.
     * This endpoint accepts log data including log type, message, and a unique log ID.
     * It uses the `createRecordSQL` function to insert the log record into a database.
     * The `verifyToken` middleware is used to authenticate the user and extract the userID from the token.
     *
     * @param {Object} req - The request object from Express, containing the log data in `req.body`:
     *    @param {string} req.body.logType - The type of the log (e.g., 'error', 'info').
     *    @param {string} req.body.logMessage - The content of the log message.
     *    @param {string} req.body.logID - A unique identifier for the log entry (optional).
     * @param {Object} res - The response object from Express used to send back responses.
     * @param {Function} next - The next middleware function in the Express middleware stack.
     *
     * @returns {Promise<void>} A Promise that resolves when the log entry has been processed.
     */
    app.post('/log', verifyToken, async (req, res) => {
        const { logType, logMessage, logID } = req.body;
        const userID = req.user.apiKey; // Extracted from token
    
        const currentDate = new Date();
        const sqliteTimestampFormat = currentDate.toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');
        const sqliteDateFormat = currentDate.toISOString().split('T')[0];;
        const recordID = uuidv4();
    
        const logRecord = {
            id: recordID,
            logID: logID,
            type: logType,
            message: logMessage,
            userID: userID,
            created: sqliteTimestampFormat,
            date: sqliteDateFormat
        };
        console.log('logging record')
        try {
        await createRecordSQL('log', logRecord);
        res.status(200).send('Log recorded');
        } catch (error) {
        res.status(500).send('Error recording log');
        }
    });
    /**
     * Usage example with curl:
     *
     * To send a log message to the logging endpoint, use the following curl command:
     * Replace `your_token_here` with the actual bearer token, and modify the logType, logMessage, and logID as needed.
     *
     * curl -X POST http://localhost:4040/log \
     * -H 'Content-Type: application/json' \
     * -H 'Authorization: Bearer your_token_here' \
     * -d '{
     *       "logType": "info",
     *       "logMessage": "Sample log message",
     *       "logID": "12345"
     *     }'
     *
     * This command sends a POST request to the logging endpoint with a JSON body containing the log type, message, and ID.
     */


    //RETREIVAL
    /**
     * Handles GET requests for retrieving log records.
     * The endpoint uses query parameters to filter the logs and includes user authentication
     * to ensure logs are retrieved only for the authenticated user. The `verifyToken` middleware
     * is used for authentication, which adds the authenticated user's details to the `req.user` object.
     *
     * @param {Object} req - The request object from Express. It includes:
     *    @param {Object} req.query - Query parameters containing the filtering conditions for logs.
     *        Expected format: `conditions` as a URL-encoded JSON string representing an array of objects.
     *        Each object is a key-value pair representing a filter condition.
     *    @param {Object} req.user - User object populated by `verifyToken` middleware, containing user details.
     *        @param {string} req.user.apiKey - The user's API key or unique identifier extracted from the token.
     * @param {Object} res - The response object from Express. Used to send back the retrieved logs or error messages.
     * @param {Function} next - The next middleware function in the Express middleware stack.
     *
     * @returns {Promise<void>} A Promise that resolves when the log retrieval process is complete.
     */
    app.get('/log', verifyToken, async (req, res) => {
        // Extracting userID from the verified token
        const userID = req.user.apiKey;
    
        // Extracting query parameters
        // Expecting query parameter to be in the format: ?conditions=[{"key1":"value1"}, {"key2":"value2"}]
        let queryConditions = [];
        console.log('incoming query: ',req.query.conditions)
        // Check if conditions are provided
        if (req.query.conditions) {
            try {
                queryConditions = JSON.parse(req.query.conditions);
            } catch (error) {
                return res.status(400).send('Invalid query conditions format');
            }
        }
        // Ensure that the array has an object at the 0 index
        if (queryConditions.length === 0) {
            queryConditions.push({}); // Initialize an empty object if the array is empty
        }
        // Adding userID to the query conditions
        queryConditions[0].userID = userID;
        console.log('constructed query: ',queryConditions)
    
        try {
            const logs = await findRecordsSQL('log', queryConditions);
            res.json(logs);
        } catch (error) {
            res.status(500).send('Error retrieving logs');
        }
    });
    /**
     * Usage examples with curl for retrieving log records:
     *
     * Basic Usage:
     * Replace `your_token_here` with the actual bearer token. This example retrieves all logs for the authenticated user.
     *
     * curl -X GET http://localhost:4040/log \
     * -H 'Authorization: Bearer your_token_here'
     *
     * With Query Conditions:
     * Replace `your_token_here` with the actual bearer token. Modify the query conditions as needed.
     * The conditions are passed as a JSON string in the `conditions` query parameter.
     *
     * Example 1: Retrieve logs of a specific type (e.g., 'error')
     * curl -X GET "http://localhost:4040/log?conditions=[{\"type\":\"error\"}]" \
     * -H 'Authorization: Bearer your_token_here'
     *
     * Example 2: Retrieve logs with a specific message content
     * curl -X GET "http://localhost:4040/log?conditions=[{\"message\":\"specific message content\"}]" \
     * -H 'Authorization: Bearer your_token_here'
     *
     * Note: In a production environment, ensure to URL-encode the JSON string in the query parameters.
     */


    

};