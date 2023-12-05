const sqlite3 = require('sqlite3').verbose();

/**
 * Inserts a record into a specified table with provided field values.
 * 
 * @param {string} table The name of the table to insert into.
 * @param {Object} fieldValues An object containing field names as keys and their values.
 * @returns {Promise<any[]>}  a new Promise that encapsulates the database operations.
 */
function createRecordSQL(table, fieldValues) {
    return new Promise((resolve, reject) => {
        console.log('createRecordSQL');
        const dbPath = './db.sqlite';
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');

            const fields = Object.keys(fieldValues);
            const values = Object.values(fieldValues);
            const placeholders = fields.map(() => '?').join(', ');

            const insertSQL = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;

            db.run(insertSQL, values, function(err) {
                if (err) {
                    console.error('Error inserting record:', err.message);
                    if (err.message.includes('no such column:')) {
                        const failedField = err.message.split('no such column:')[1].trim();
                        console.error(`The error is related to the field: ${failedField}`);
                    }
                    reject(err);
                    return;
                }
                console.log(`A record has been inserted with rowid ${this.lastID}`);
                resolve(this.lastID);

                db.close((err) => {
                    if (err) {
                        console.error('Error closing database', err);
                        reject(err);
                        return;
                    }
                    console.log('Closed the database connection.');
                });
            });
        });
    });
}
/* 
const sqlite3 = require('sqlite3').verbose();

Example usage of createRecordSQL
const tableName = 'users';
const newUser = {
    name: 'John Doe',
    email: 'johndoe@example.com'
};

createRecordSQL(tableName, newUser)
    .then(lastID => {
        console.log(`New user added with ID: ${lastID}`);
    })
    .catch(error => {
        console.error('Failed to add new user:', error);
    });
*/

/**
 * Performs a SELECT query on the specified table with provided query conditions.
 * 
 * @param {string} table The name of the table to query.
 * @param {Object[]} queryConditions An array of objects representing query conditions.
 * @returns {Promise<any[]>} A promise that resolves to an array of the found records.
 */
function findRecordsSQL(table, queryConditions) {
    return new Promise((resolve, reject) => {
        // Check if queryConditions is an array
        if (!Array.isArray(queryConditions)) {
            console.error('queryConditions must be an array');
            reject(new Error('queryConditions must be an array'));
            return;
        }
        const dbPath = './db.sqlite';
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');
        });

        // Construct the WHERE clause
        const whereClauses = queryConditions.map(condition => {
            const keys = Object.keys(condition);
            return keys.map(key => `${key} = ?`).join(' AND ');
        }).join(' OR ');

        const queryParams = queryConditions.flatMap(condition => Object.values(condition));
        const selectSQL = `SELECT * FROM ${table} WHERE ${whereClauses}`;
        console.log('sql search: ',selectSQL)

        db.all(selectSQL, queryParams, (err, rows) => {
            db.close();

            if (err) {
                console.error('Error executing SELECT query', err);
                reject(err);
                return;
            }

            console.log('Query executed successfully.');
            resolve(rows);
        });
    });
}
/*
Example usage
findRecordsSQL('users', [{ name: 'smith', state: 'ny' }])
    .then(records => console.log('Records found:', records))
    .catch(err => console.error('Error finding records:', err));
*/

/**
 * Modifies all records that match the query conditions with new values.
 * 
 * @param {string} table The name of the table.
 * @param {Object[]} queryConditions An array of objects representing query conditions.
 * @param {Object} modifyValues An object containing fields to modify and their new values.
 * @returns {Promise<void>} A promise representing the operation's completion.
 */
function modifyAllSQL(table, queryConditions, modifyValues) {
    return new Promise((resolve, reject) => {
        const dbPath = './db.sqlite';
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');

            try {
                // First, find the records that match the query conditions
                const records = await findRecordsSQL(table, queryConditions);
                if (records.length === 0) {
                    console.log('No records found to modify.');
                    resolve();
                    return;
                }

                // Construct the UPDATE SQL statement
                const fieldsToUpdate = Object.keys(modifyValues).map(key => `${key} = ?`).join(', ');
                const updateSQL = `UPDATE ${table} SET ${fieldsToUpdate} WHERE ${queryConditions.map(condition => {
                    return '(' + Object.keys(condition).map(key => `${key} = ?`).join(' AND ') + ')';
                }).join(' OR ')}`;

                const updateParams = [...Object.values(modifyValues), ...queryConditions.flatMap(condition => Object.values(condition))];

                // Execute the UPDATE query
                db.run(updateSQL, updateParams, function(err) {
                    if (err) {
                        console.error('Error updating records', err);
                        reject(err);
                        return;
                    }
                    console.log(`Records updated: ${this.changes}`);
                    resolve();
                });
            } catch (err) {
                console.error('Error during record modification', err);
                reject(err);
            } finally {
                db.close();
            }
        });
    });
}

/* Example usage
modifyAll('users', [{ name: 'smith', state: 'ny' }], { usage: 20 })
    .then(() => console.log('Modification completed.'))
    .catch(err => console.error('Error in modification:', err));
*/

/**
 * Modifies records based on complex conditional logic.
 * 
 * @param {string} table The name of the table.
 * @param {Object[]} queryConditions Array of objects representing query conditions.
 * @param {Object[]} modifyWHERE Array of modification rules.
 * @returns {Promise<void>} A promise representing the operation's completion.
 */
function modifyWhereSQL(table, queryConditions, modifyWHERE) {
    return new Promise((resolve, reject) => {
        const dbPath = './db.sqlite';
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');

            try {
                // Find records that match the query conditions
                const records = await findRecordsSQL(table, queryConditions);
                if (records.length === 0) {
                    console.log('No records found for modification.');
                    resolve();
                    return;
                }

                // Apply each modification rule
                for (const rule of modifyWHERE) {
                    const { field, where, setTo, setWhen = true } = rule;

                    for (const record of records) {
                        if ((record[field] === where) === setWhen) {
                            const updateSQL = `UPDATE ${table} SET ${field} = ? WHERE id = ?`;
                            await new Promise((resolve, reject) => {
                                db.run(updateSQL, [setTo, record.id], function (err) {
                                    if (err) {
                                        console.error(`Error updating record with id ${record.id}`, err);
                                        reject(err);
                                    } else {
                                        console.log(`Record with id ${record.id} updated.`);
                                        resolve();
                                    }
                                });
                            });
                        }
                    }
                }
                resolve();
            } catch (err) {
                console.error('Error during record modification', err);
                reject(err);
            } finally {
                db.close();
            }
        });
    });
}

/* Example usage
modifyWhereSQL('users', [{ state: 'ny' }], [
    { field: 'usage', where: 10, setTo: 20 },
    { field: 'username', where: 'johndoe', setTo: 'johnsmith', setWhen: false }
])
.then(() => console.log('Modification completed.'))
.catch(err => console.error('Error in modification:', err));
*/

/**
 * Deletes all records that match the query conditions.
 * 
 * @param {string} table The name of the table.
 * @param {Object[]} queryConditions Array of objects representing query conditions.
 * @returns {Promise<void>} A promise representing the operation's completion.
 */
function deleteRecordSQL(table, queryConditions) {
    return new Promise((resolve, reject) => {
        const dbPath = './db.sqlite';
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, async (err) => {
            if (err) {
                console.error('Error opening database', err);
                reject(err);
                return;
            }
            console.log('Connected to the SQLite database.');

            try {
                // Find records that match the query conditions
                const records = await findRecordsSQL(table, queryConditions);
                if (records.length === 0) {
                    console.log('No records found to delete.');
                    resolve();
                    return;
                }

                // Delete the found records
                const deleteSQL = `DELETE FROM ${table} WHERE ${queryConditions.map(condition => {
                    return '(' + Object.keys(condition).map(key => `${key} = ?`).join(' AND ') + ')';
                }).join(' OR ')}`;

                const deleteParams = queryConditions.flatMap(condition => Object.values(condition));
                
                db.run(deleteSQL, deleteParams, function(err) {
                    if (err) {
                        console.error('Error deleting records', err);
                        reject(err);
                        return;
                    }
                    console.log(`Records deleted: ${this.changes}`);
                    resolve();
                });
            } catch (err) {
                console.error('Error during record deletion', err);
                reject(err);
            } finally {
                db.close();
            }
        });
    });
}

/* Example usage
deleteAllFound('users', [{ state: 'ny' }, { usage: 10 }])
.then(() => console.log('Deletion completed.'))
.catch(err => console.error('Error in deletion:', err));
*/



module.exports = {
    createRecordSQL, findRecordsSQL, modifyAllSQL, modifyWhereSQL, deleteRecordSQL,
};