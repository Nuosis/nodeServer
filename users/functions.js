require('dotenv').config();
const { generateApiKey, generateUUID, hashPassword} = require('../auth/security')
const { createRecordSQL, findRecordsSQL, modifyAllSQL, modifyWhereSQL, deleteRecordSQL, } = require('../SQLite/functions.js');
const { sendVerificationEmail } = require('../emailTemplates/verification.js');


const WEBHOOKhost = process.env.WEBHOOKhost; 
if (!WEBHOOKhost) {
    throw new Error('Required environmental variable is undefined');
}

async function createCompany(company) {
    console.log("createCompanyFunction");
    if (!company) {
        return res.status(400).json({ message: 'Company required' });
    }

    const id = generateUUID();
    const apiKeyDetails = generateApiKey(); // this returns { apiKey, publicKey }
    const timestamp = new Date().toISOString();

    const comapnyRecord = {
        id: id,
        idFilemaker: '',
        apiKey: apiKeyDetails.apiKey,
        created: timestamp,
        modified: timestamp
    };
    console.log("companyRecord", companyRecord);

    try {
        await createRecordSQL('company', companyRecord);
        console.log('Company created successfully');

    } catch (error) {
        console.error('Error occurred:', error);

        // Rollback user creation if email sending fails or any other error occurs
        console.error('Rolling back user creation.');
        try {
            await deleteRecordSQL('users', { id: id });
            console.log('User creation rolled back successfully.');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }

        return null; // Indicate failure
    }

    return { apiKey: apiKeyDetails.apiKey };
}

async function createUser(companyId, username, password) {
    console.log("createUser");
    if (!companyId || !username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }
    const userId = generateUUID();
    const hashedPassword = await hashPassword(password);
    const apiKeyDetails = generateApiKey(); // this returns { apiKey, publicKey }
    const timestamp = new Date().toISOString();

    const userRecord = {
        id: userId,
        idCompany: companyId,
        username: username,
        password: hashedPassword,
        filemakerId: '', // Ignored during creation
        // apiKey: apiKeyDetails.apiKey, MOVED TO COMPANY
        verified: 0,
        created: timestamp,
        modified: timestamp
    };
    console.log("userRecord", userRecord);

    try {
        await createRecordSQL('users', userRecord);
        console.log('User created successfully');

        // SEND VERIFICATION EMAIL
        const verificationUrl = process.env.WEBHOOKhost + '/email_verification'; // Replace with actual URL
        const emailSent = await sendVerificationEmail(username, verificationUrl);

        if (!emailSent) {
            throw new Error('Email sending failed');
        }

    } catch (error) {
        console.error('Error occurred:', error);

        // Rollback user creation if email sending fails or any other error occurs
        console.error('Rolling back user creation.');
        try {
            await deleteRecordSQL('users', { id: id });
            console.log('User creation rolled back successfully.');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }

        return null; // Indicate failure
    }

    return { id, username, apiKey: apiKeyDetails.apiKey, publicKey: apiKeyDetails.publicKey };
}



/*
 * 
 * FOR READ, UPDATE AND DELETE
 * Use SQLite Funcitons directly. No need to user specific functionality
 * 
 */


module.exports = {
    createUser,
    createCompany
};