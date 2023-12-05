const { generateApiKey, generateUUID, hashPassword} = require('../auth/security')
const { createRecordSQL, findRecordsSQL, deleteRecordSQL, } = require('../SQLite/functions.js');

async function createCompany(company) {
    console.log("createCompanyFunction");

    if (!company) {
        throw new Error('Company required');
    }

    const id = generateUUID();
    const apiKeyDetails = generateApiKey(); // this returns { apiKey, publicKey }
    const timestamp = new Date().toISOString();

    const companyRecord = {
        id: id,
        idFilemaker: '',
        company,
        apiKey: apiKeyDetails.apiKey,
        created: timestamp,
        modified: timestamp
    };
    console.log("companyRecord", companyRecord);

    try {
        await createRecordSQL('company', companyRecord);
        console.log('Company created successfully');
        return { company, apiKey: apiKeyDetails.apiKey }; // Return both ID and API Key
    } catch (error) {
        console.error('Error occurred:', error);
        console.error('Rolling back company creation.');

        try {
            await deleteRecordSQL('company', { id: id });
            console.log('Company creation rolled back successfully.');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }

        throw error; // Rethrow the error after attempting rollback
    }
}


async function createUser(company, username, password) {
    console.log("createUser");

    if (!company || !username || !password) {
        throw new Error('Username and password are required');
    }

    const companyInfo = findRecordsSQL('company', [{company}]);
    if (!companyInfo) {
        throw new Error('Company not found');
    }

    const companyId = companyInfo.id;
    const userId = generateUUID();
    const hashedPassword = await hashPassword(password);
    const timestamp = new Date().toISOString();

    const userRecord = {
        id: userId,
        idCompany: companyId,
        username,
        password: hashedPassword,
        filemakerId: '', // Ignored during creation
        verified: 0,
        created: timestamp,
        modified: timestamp
    };
    console.log("userRecord", userRecord);

    try {
        await createRecordSQL('users', userRecord);
        console.log('User created successfully');
        return { id: userId, username }; // Correct return value
    } catch (error) {
        console.error('Error occurred:', error);
        console.error('Rolling back user creation.');

        try {
            await deleteRecordSQL('users', { id: userId });
            console.log('User creation rolled back successfully.');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }

        throw error; // Rethrow the error after attempting rollback
    }
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