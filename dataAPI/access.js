const axios = require('axios');

const base64Encode = function(username,password){
    const combined = username + ":" + password;
    return btoa(combined);
} 

// https://server.selectjanitorial.com/fmi/data/apidoc

async function getFileMakerToken(server, database, userName, password) {

    const base64Value = base64Encode(userName, password);
    

    const url = 'https://'+server+'/fmi/data/vLatest/databases/'+database+'/sessions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + base64Value,
    };

    try {
        const response = await axios.post(url, {}, { headers });
        // console.log('call response:',response);
        const token = response.data.response.token;
        return token;
    } catch (error) {
        console.error('FMDapiAuth ERROR:', error);
        throw error; // Throw the error back to be caught by the calling function
    }
};

async function releaseFileMakerToken(server, database, token) {
    
	// https://{server}/fmi/data/{version}/databases/{database}/sessions/{sessionToken}
    const url = 'https://'+server+'/fmi/data/vLatest/databases/'+database+'/sessions/'+token;

    try {
        const response = await axios.delete(url, {}, {});
        const meaningfulData = {
            'responseCode': response.status, // or whatever field holds the record identifier
            'result': response.statusText, // or another field of interest
            'responseConfig': response.config
        }
        // console.log('call response:',response);
        return meaningfulData;
    } catch (error) {
        console.error('FMDapiAuth ERROR:', error);
        throw error; // Throw the error back to be caught by the calling function
    }
};

module.exports = {
  getFileMakerToken, releaseFileMakerToken
};