const { generateApiKey, generateUUID, hashPassword} = require('../app/auth/security.js');
const { createRecordSQL, findRecordsSQL, deleteRecordSQL, } = require('../app/SQLite/functions');

async function createCompany(company) {
    console.log("createCompanyFunction");

    if (!company) {
        throw new Error('Company required');
    }

    const id = generateUUID();
    const apiKeyDetails = generateApiKey(); // this returns { apiKey }
    // const token = generateToken(apiKeyDetails.apiKey,''); REMOVED tokens are generated at the user level. API keys are generated at the company level
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
        return { 
            company, 
            apiKey: apiKeyDetails.apiKey};
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

async function createUser(apiKey, username, password, access, reset) {
    console.log("createUser");
    
    // if access is not passed will be set to 'standard'
    if (!apiKey || !username || !password ) {
        throw new Error('ApiKey, Username and Password are required');
    }

    const companyInfo = await findRecordsSQL('company', [{apiKey}]);
    if (!companyInfo || !companyInfo.length) {
        throw new Error('Company not found');
    }
    console.log("company found: ", companyInfo);

    const accessData = access || 'standard' ;
    const companyId = companyInfo[0].id;
    const userId = generateUUID();
    const hashedPassword = await hashPassword(password);
    const timestamp = new Date().toISOString();
    const resetPassword = reset || false;

    const userRecord = {
        id: userId,
        companyId: companyId,
        username,
        password: hashedPassword,
        filemakerId: '', // Ignored during creation
        verified: false,
        created: timestamp,
        modified: timestamp,
        access: accessData,
        resetPassword: resetPassword
    };
    console.log("userRecord", userRecord);

    try {
        await createRecordSQL('users', userRecord);
        console.log('User created successfully');
        return { id: userId, username }; // Correct return value
    } catch (error) {
        console.error('Rolling back user creation.');

        try {
            await deleteRecordSQL('users', [{ id: userId }]);
            console.log('User creation rolled back successfully.');
        } catch (rollbackError) {
            console.error('Error during rollback:', rollbackError);
        }

        throw error; // Rethrow the error after attempting rollback
    }
}

async function updateUser(apiKey, username, newPassword, newAccess = null) {
    console.log("updateUser");
    try {
        // Basic validation
        if (!apiKey || !username || !newPassword) {
            throw new Error('ApiKey, Username, and New Password are required');
        }

        // Confirm company exists
        const companyInfo = await findRecordsSQL('company', [{apiKey}]);
        if (!companyInfo || companyInfo.length === 0) {
            throw new Error('Company not found');
        } 
        const companyId = companyInfo[0].id
        if (!companyId || companyId.length === 0) {
            throw new Error('CompanyId not found');
        } 

        // Confirm user exists
        const userInfo = await findRecordsSQL('users', [{username, companyId}]);
        if (!userInfo || userInfo.length === 0) {
            throw new Error('User not found');
        }

        const hashedPassword = await hashPassword(newPassword); // Assumes a hashPassword function

        // Prepare modifications
        const modifications = [];
        const currentDate = new Date().toISOString();

        if (newPassword) {
            const hashedPassword = await hashPassword(newPassword);
            modifications.push({ field: "password", setTo: hashedPassword });
        }
        if (newAccessLevel) {
            modifications.push({ field: "access", setTo: newAccessLevel });
        }
        if (newReset !== null) {
            // Assuming newReset is a boolean and the database expects an integer (1 for true, 0 for false)
            modifications.push({ field: "resetPassword", setTo: newReset ? 1 : 0 });
        }
        // Always update the modified timestamp
        modifications.push({ field: "modified", setTo: currentDate });

        // Update user details in the database
        await modifyWhereSQL('users', [{ username }], modifications);
        console.log('User updated successfully.');
        return { username, updated: true };
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
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
    updateUser,
    createCompany
};