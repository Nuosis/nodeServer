require('dotenv').config();
const { getFileMakerToken, releaseFileMakerToken } = require('../dataAPI/access');
const { createRecord, findRecord, editRecord, deleteRecord, duplicateRecord } = require('../dataAPI/functions');



module.exports = function (app) {
    
    
    
    // PRM/TWILIO END POINT
    // /prm/twilio
    app.post('/prm/twilio', async (req, res) => {
        // console.log("Incoming request: ", req);
        const server = process.env.DEVhost;
        const database = 'PRM';
        const username = process.env.PRMun;
        if (!username) {
        throw new Error('Required environmental variable username is undefined');
        }
        const password = process.env.PRMpw;
        if (!username) {
        throw new Error('Required environmental variable password is undefined');
        }
        const dataString = req.body;
    
        if (!dataString) {
        throw new Error('Required body.file is undefined');
        }
        console.log('server:',server,'db:',database,'username',username,'pw',password,'data',dataString)
        
        // Parse the 'data' string into a JavaScript object
        const incomingData = JSON.stringify(dataString);
    
        let token; // Declare token outside the try block
        
        
        /* GET FILEMAKER TOKEN */ 
        try {
        token = await getFileMakerToken(server, database, username, password);
        console.log("Token:", token);
        } catch (error) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.statusText || "Internal Server Error";
    
        console.log("Error getting FileMaker token:", {'status': statusCode, 'errorMessage':errorMessage} );
        //res.status(500).send("Error in getting FileMaker token");
        res.status(statusCode).send({
            error: "Error in getting FileMaker token",
            details: errorMessage
        });
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
};