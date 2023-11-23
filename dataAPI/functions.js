const axios = require('axios');

async function createRecord(server, database, layout, token, params) {
    const url = 'https://' + server + '/fmi/data/vLatest/databases/' + database + '/layouts/' + layout + '/records';
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
        throw- error; // Rethrow the error for the calling function to handle
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
        const response = await axios.del(url, params, { headers });
        // console.log('delete record verbos response:', response.data);
      
        return response.data; // Return the response data
        
        
    } catch (error) {
        // console.error('Create record ERROR:', error);
        throw error; // Rethrow the error for the calling function to handle
    }
};

module.exports = {
  createRecord, findRecord, editRecord, deleteRecord, duplicateRecord
};
