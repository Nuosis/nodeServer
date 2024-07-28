require('dotenv').config();
const { verifyToken } = require('../auth/security');
const access = require( '../dataAPI/access');
const fmCrud = require('../dataAPI/functions');

// Unified ClarityData API Endpoint
async function clarityDataApi(req, res) {
    const { server, database, layout, params, method, recordID } = req.body;
    console.log("/clarityDataAPI method:",method)

    // Validate required parameters
    if( method === 'createRecord' || method === 'findRecord') {
        if (!server || !database || !layout || !params ) {
            console.log("error: missing parameter 1")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
    } else if ( method === 'deleteRecord' ) {
        if (!server ) {
            console.log("error: missing parameter: server")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        if (!database) {
            console.log("error: missing parameter: database")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        if (!layout) {
            console.log("error: missing parameter: layout")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        if (!recordID ) {
            console.log("error: missing parameter: recordID")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
        console.log("parameters passed")
    } else if (method === 'runScript') {
        if (!server || !database || !layout || !params || !params.scriptName) {
            console.log("error: missing parameter for runScript");
            return res.status(400).json({ error: 'Missing required parameters' });
        }
    } else if ( !method ) {
            console.log("error: missing method parameter 2")
            return res.status(400).json({ error: 'Missing required parameters' });
    } else {
        if (!server || !database || !layout || !params || !recordID) {
            console.log("error: missing parameter 3")
            return res.status(400).json({ error: 'Missing required parameters' });
        }
    }

    // Check if the method is supported
    if (!['createRecord', 'findRecord', 'editRecord', 'deleteRecord', 'duplicateRecord', 'runScript'].includes(method)) {
        console.log("error: unsupported method")
        return res.status(400).json({ error: 'Unsupported method' });
    }

    // Variables for FileMaker authentication
    const userName = process.env.DEVun;
    const password = process.env.DEVpw;

    let token;
    let responseData; 

    try {
        // Acquire token for FileMaker Data API access
        token = await access.getFileMakerToken(server, database, userName, password);
        
        if (!token) {
            console.log("error: unable to aquire token for database:", {server,database})
            return res.status(500).json({ error: 'Failed to acquire FileMaker token' });
        }

        // Dynamically call the appropriate function based on the method parameter
        if(method ==='createRecord') {
            const utc = Date.now();  
            // Create a date object for the current time in "America/Vancouver" timezone
            const vancouverDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Vancouver" }));
            // Define options for formatting parts of the date
            const dateOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            // Use Intl.DateTimeFormat to get each part of the date
            const formattedDate = new Intl.DateTimeFormat('en-US', dateOptions).format(vancouverDate);
            const formattedTime = new Intl.DateTimeFormat('en-US', timeOptions).format(vancouverDate);
            // Combine the date and time parts
            const fileMakerDate = `${formattedDate} ${formattedTime}`;
            console.log(fileMakerDate);
    
            params.fieldData = params.fieldData || {};
            // Merge the new fields into params.fieldData
            Object.assign(params.fieldData, {
                "_orgID": req.user.companyId,
                "~ModifiedBy": req.user.userId,
                "~CreatedBy": req.user.userId,
                "~modifiedUTC": utc,
                "~syncUTC": utc,
                "~CreationTimestamp": fileMakerDate,
                "~ModificationTimestamp": fileMakerDate
            });
            // console.log("params: ", {params})
            responseData = await fmCrud[method](server, database, layout, token, params);
        } else if(method === 'findRecord'){
            responseData = await fmCrud[method](server, database, layout, token, params);
        } else if(method === 'deleteRecord'){
            responseData = await fmCrud[method](server, database, layout, recordID, token);
        } else if (method === 'runScript') {
            responseData = await fmCrud.runScript(server, database, layout, token, params);
        }  else {
            // Ensure recordID is correctly defined or passed for these methods
            responseData = await fmCrud[method](server, database, layout, recordID, token, params);
        }
        // Attempt to release the token
        await access.releaseFileMakerToken(server, database, token);
        // console.log("token released")

        // Return the response data from FileMaker API
        return res.status(200).json(responseData);
    } catch (error) {
        console.error(`${method} ERROR:`);

        // Attempt to release the token in case of error, if acquired
        if (token) {
            try {
                await access.releaseFileMakerToken(server, database, token);
            } catch (releaseError) {
                console.error('Error releasing token:', releaseError);
            }
        }

        return res.status(500).json({ error: error.response.data.messages });
    }
}


// Exporting the endpoints at the end of the file
module.exports = function(app) {
    // CREATE

    /**
     * PROPS: { server, database, layout, params, recordID*, method} as defined by the dataApi in FileMaker
     *          METHOD: String [createRecord, findRecord, editRecord*, deleteRecord*, duplicateRecord*] (*) requires recordId
     */
    app.post('/clarityData', verifyToken, clarityDataApi);
    /**
     * CREATE
     * curl -X POST http://localhost:4040/clarityDataApi \
     * -H "Content-Type: application/json" \
     * -d '{"server": "server.selectjanitorial.com", "database": "clarityData", "layout": "dapiParty", "params": {"fieldData": {"displayName": "userName","f_company": "0","firstName": "firstName","lastName": "lastName"}}}'
     */
};
