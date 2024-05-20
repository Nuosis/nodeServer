const axios = require('axios');

async function createRecord(server, database, layout, token, params) {
    console.log("fmCreate called")
    //console.log({server})
    //console.log({database})
    //console.log({layout})
    //console.log({params})
    //console.log({token})
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/records';
    //console.log({url})
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    try {
        const response = await axios.post(url, params, { headers });
        //console.log('Create record verbos response:', response.data);
        return response.data; // Return the response data
        
    } catch (error) {
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error("Data:", error.response.data);
            console.error("Status:", error.response.status);
            console.error("Headers:", error.response.headers);
        } else if (error.request) {
            // The request was made but no response was received
            console.error("Request:", error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error("Error message:", error.message);
        }
        //console.error("Config:", error.config);
        throw error;
    }
};

async function findRecord(server, database, layout, token, params) {
	//https://server.selectjanitorial.com/fmi/data/{version}/databases/{database}/layouts/{layout}/_find
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/_find';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    try {
        const response = await axios.post(url, params, { headers });
        // console.log('Create record verbos response:', response.data);
    
        return response.data; // Return the response data
        
        
    } catch (error) {
        // console.error('Create record ERROR:', error);
        throw error; // Rethrow the error for the calling function to handle
    }
};

async function editRecord(server, database, layout, recordID, token, params) {
	//https://server.selectjanitorial.com/fmi/data/{version}/databases/{database}/layouts/{layout}/records/{recordId}
	
	/*
	PAYLOAD example
	{	
        "fieldData": {},
        "portalData": {},
        "modId": "string",
        "script": "string",
        "script.param": "string",
        "script.prerequest": "string",
        "script.presort": "string",
        "script.presort.param": "string"
	}
	*/
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/records/' + recordID;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    try {
        const response = await axios.patch(url, params, { headers });
        // console.log('Create record verbos response:', response.data);
    
        return response.data; // Return the response data
        
        
    } catch (error) {
        // console.error('Create record ERROR:', error);
        throw error; // Rethrow the error for the calling function to handle
    }
};

async function duplicateRecord(server, database, layout, recordID, token, params) {
	//https://server.selectjanitorial.com/fmi/data/{version}/databases/{database}/layouts/{layout}/records/{recordId}
	/*
	PAYLOAD example
	{
        "script": "string",
        "script.param": "string",
        "script.prerequest": "string",
        "script.prerequest.param": "string",
        "script.presort": "string",
        "script.presort.param": "string"
	}
	*/
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/records/' + recordID;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    try {
        const response = await axios.post(url, params, { headers });
        // console.log('Create record verbos response:', response.data);
    
        return response.data; // Return the response data
        
        
    } catch (error) {
        // console.error('Create record ERROR:', error);
        throw- error; // Rethrow the error for the calling function to handle
    }
};

async function deleteRecord(server, database, layout, recordID, token) {
	//https://server.selectjanitorial.com/fmi/data/{version}/databases/{database}/layouts/{layout}/records/{recordId}
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/records/' + recordID;
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    };

    try {
        const response = await axios.delete(url, { headers });
        // console.log('delete record verbos response:', response.data);
    
        return response.data; // Return the response data
        
        
    } catch (error) {
        // console.error('Create record ERROR:', error);
        throw error; // Rethrow the error for the calling function to handle
    }
};

async function runScript(server, database, layout, token, params) {
    // Construct the URL to access the FileMaker script endpoint
    const url = `https://${server}/fmi/data/vLatest/databases/${database}/layouts/${layout}/script/${params.scriptName}`;
    
    // Set up the headers for the HTTP request
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
    };

    try {
        // Make the POST request to run the script
        const response = await axios.post(url, params.scriptParameters, { headers });
        
        // Logging the response can help in development to debug
        // console.log('Run script verbose response:', response.data);

        // Return the response data
        return response.data;
    } catch (error) {
        // Log the error to the console for debugging
        console.error('Error running FileMaker script:', error);
        throw error; // Rethrow the error for the calling function to handle
    }
}

module.exports = {
    createRecord, findRecord, editRecord, deleteRecord, duplicateRecord, runScript
};
