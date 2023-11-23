require('dotenv').config();
const crypto = require('crypto');
const { generateApiKey, generateUUID } = require('./auth/generateApiKey');
const { createRecordSQL, findRecordsSQL, modifyAllSQL, modifyWhereSQL, deleteRecordSQL, } = require('.SQLite/funcitons.js');

function hashPassword(password) {
    const secretKey = process.env.SECRETKEY;
    return crypto.createHmac('sha256', secretKey).update(password).digest('hex');
}

async function createUser(username, password) {
    const id = generateUUID();
    const hashedPassword = hashPassword(password);
    const apiKeyDetails = generateApiKey(); // this returns { apiKey, publicKey }
    const timestamp = new Date().toISOString();

    const userRecord = {
        id: id,
        username: username,
        password: hashedPassword,
        filemakerId: '', // Ignored during creation
        apiKey: apiKeyDetails.apiKey,
        verified: 0,
        created: timestamp,
        modified: timestamp
    };

    try {
        await createRecordSQL('users', userRecord);
        console.log('User created successfully');

        // SEND VERIFICATION EMAIL
        const verificationUrl = process.env.WEBHOOKhost + '/email_verification'; // Replace with actual URL
        await sendVerificationEmail(username, verificationUrl);

    } catch (error) {
        console.error('Error creating user:', error);
    }

    return { id, username, apiKey: apiKeyDetails.apiKey, publicKey: apiKeyDetails.publicaKey };
}

/*
 * 
 * FOR READ, UPDATE AND DELETE
 * Use SQLite Funcitons directly. No need to user specific functionality
 * 
 */


module.exports = {
    createUser
};