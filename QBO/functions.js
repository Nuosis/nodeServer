const QuickBooks = require('node-quickbooks');
const { runScript, findRecord } = require('../dataAPI/functions');
const {findRecordsSQL} = require('../SQLite/functions');
const access = require('../dataAPI/access');
const axios = require('axios');
const { parse } = require('dotenv');


async function configQBO(apiKey) {
    const companyQueryConditions = { apiKey };
    const companyIdFilemaker = await findRecordsSQL('company', [companyQueryConditions]);

    if (!companyIdFilemaker) {
        console.error('Company not found for apiKey:', apiKey);
        return { error: 'Company not found' };
    }

    const userName = process.env.DEVun;
    const password = process.env.DEVpw;
    const server = "server.claritybusinesssolutions.ca";
    const database = "clarityData";
    const layout = 'dapiModulesSelected'; // Store tokenized apiKeys there
    let token;

    try {
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        const query = [{ '_orgID': companyIdFilemaker[0].id, 'moduleName': 'QBO', 'f_active': 1 }];
        const response = await findRecord(server, database, layout, token, { query });
        // console.log(query)
        // console.log(response.response.data)

        if (!response || !response.response.data || !response.response.data[0] || !response.response.data[0].fieldData) {
            console.error('QBO Module ID not found');
            return { error: 'QBO module not found. Either the orgID is wrong or QBO is no longer active' };
        }

        const moduleID = response.response.data[0].fieldData["__ID"];

        const params = {
            scriptName: 'qb . refreshToken',
            scriptParameters: {
                orgID: companyIdFilemaker[0].id,
                recordID: moduleID,
                returnFull: true
            }
        };

        const scriptResult = await runScript(server, database, layout, token, params);
        //console.log('Script Result:', scriptResult);
        return scriptResult.response ? scriptResult.response.scriptResult : null;
    } catch (err) {
        console.error('Error executing script:', err);
        return { error: 'Error executing script' };
    } finally {
        if (token) {
            await access.releaseFileMakerToken(server, database, token);
        }
    }
}

// Initialize QBO API with credentials
async function initializeQBO(apiKey) {
    try {
        const result = await configQBO(apiKey); 
        if (typeof result === 'string') {
            qboConfig = JSON.parse(result);  // Only parse if result is a string
        } else {
            qboConfig = result;  // Directly use it if it's already an object
        } 
        //console.log('qboConfig:', qboConfig)
        //console.log('qboConfig keys:', Object.keys(qboConfig))

        // Check for client configuration
        if (!qboConfig.client) {
            throw new Error('Client object is missing in qboConfig');
        }
        if (!qboConfig.client.ID) {
            throw new Error('Client ID is missing in qboConfig');
        }
        if (!qboConfig.client.Secret) {
            throw new Error('Client Secret is missing in qboConfig');
        }
        // Note the misspelling here of 'relm'
        if (!qboConfig.relm || !qboConfig.relm.ID) {
            throw new Error('Realm ID missing in qboConfig');
        }
        if (!qboConfig.access || !qboConfig.access.Token) {
            throw new Error('Access Token is missing in qboConfig');
        }
        if (!qboConfig.refresh || !qboConfig.refresh.Token) {
            throw new Error('Refresh Token is missing in qboConfig');
        }
        const qbo = new QuickBooks({
            consumerKey: qboConfig.client.ID,
            consumerSecret:  qboConfig.client.Secret,
            token: qboConfig.access.Token,
            tokenSecret: "", // no token secret for OAuth2
            realmId: qboConfig.relm.ID,
            useSandbox: qboConfig.environment === 'sandbox', // use the sandbox?
            debug: true, // enable debugging?
            minorversion: null, // set minorversion, or null
            oauthversion:'2.0', // OAuth version
            refreshToken: qboConfig.refresh.Token,
        });
        //console.log('qbo:', {qbo});
        return qbo;
    } catch (error) {
        console.error('Failed to initialize QBO:', error);
        throw error;
    }
}

async function queryQBO(qbo, entity, query) {
    // Construct the method name dynamically based on the entity
    /**
     * the object can be an array of objects, each specifying a field, 
     * value and operator (optional) keys. This allows you to build a 
     * more complex query using operators such as =, IN, <, >, <=, >=, or LIKE.
     * 
     * qbo.findTimeActivities([
    {field: 'TxnDate', value: '2014-12-01', operator: '>'},
    {field: 'TxnDate', value: '2014-12-03', operator: '<'},
    {field: 'limit', value: 5}
], function (e, timeActivities) {
    console.log(timeActivities)
})
     */
    if (!entity) {
        throw new Error(`queryQBO: failed to initialize - entity missing`);
    }
    if (!qbo) {
        throw new Error(`queryQBO: failed to initialize - qbo missing`);
    }
    if (!query) {
        throw new Error(`queryQBO: failed to initialize - query missing`);
    }

    const methodName = `find${entity.charAt(0).toUpperCase() + entity.slice(1)}`;
    console.log({methodName},{query})

    // Check if the dynamically constructed method name exists on the qbo object
    if (typeof qbo[methodName] !== 'function') {
        throw new Error(`No such method: ${methodName} - check your entity name and qbo object.`);
    }

    // Return a promise that executes the query
    return new Promise((resolve, reject) => {
        qbo[methodName](query, (err, results) => {
            if (err) {
                console.error(`Error querying ${entity} with ${methodName}:`, err);
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
}

//This method runs a fiulemkaer script = more consistent
async function qboQuery(apiKey, parameters) {
    /* parameters require:
    {
        table: "", (biil, invoice, payment, etc)
        query: [
            {key: "DocNumber", operator: "=", value: "202406002"}
        ]
    }
    
    */
    const companyQueryConditions = { apiKey };
    const companyIdFilemaker = await findRecordsSQL('company', [companyQueryConditions]);

    if (!companyIdFilemaker) {
        console.error('Company not found for apiKey:', apiKey);
        return { error: 'Company not found' };
    }

    const userName = process.env.DEVun;
    const password = process.env.DEVpw;
    const server = "server.claritybusinesssolutions.ca";
    let database
    let layout
    let token;

    try {
        database = "clarityData";
        layout = 'dapiModulesSelected';
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        const query = [{ '_orgID': companyIdFilemaker[0].id, 'moduleName': 'QBO', 'f_active': 1 }];
        const response = await findRecord(server, database, layout, token, { query });
        // console.log(query)
        // console.log(response.response.data)

        if (!response || !response.response.data || !response.response.data[0] || !response.response.data[0].fieldData) {
            console.error('QBO Module ID not found');
            return { error: 'QBO module not found. Either the orgID is wrong or QBO is no longer active' };
        }

        await access.releaseFileMakerToken(server, database, token);

        //const moduleID = response.response.data[0].fieldData["__ID"];
        database = "clarityCRM";
        layout = 'QB Playground';
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        const params = {
            scriptName: 'api . qb . query',
            scriptParameters: parameters
        };

        //console.log(params.scriptParameters)

        const scriptResult = await runScript(server, database, layout, token, params);
        //console.log('Script Result:', scriptResult);
        return scriptResult.response ? scriptResult.response.scriptResult : null;
    } catch (err) {
        console.error('Error executing script:', err);
        return { error: 'Error executing script' };
    } finally {
        if (token) {
            await access.releaseFileMakerToken(server, database, token);
        }
    }
}




async function getCustomer(qbo, customerId) {
    try {
        return new Promise((resolve, reject) => {
            qbo.getCustomer(customerId, (err, customer) => {
                if (err) {
                    console.error('Error getting customer from QBO:', err);
                    reject(err);
                } else {
                    resolve(customer);
                }
            });
        });
    } catch (error) {
        console.error('Error in getCustomer:', error);
        throw error;
    }
}

async function createCustomer(qbo, customerData) {
    try {
        return new Promise((resolve, reject) => {
            qbo.createCustomer(customerData, (err, customer) => {
                if (err) {
                    console.error('Error creating customer in QBO:', err);
                    reject(err);
                } else {
                    resolve(customer);
                }
            });
        });
    } catch (error) {
        console.error('Error in createCustomer:', error);
        throw error;
    }
}

async function updateCustomer(qbo, customerId, customerData) {
    try {
        return new Promise((resolve, reject) => {
            qbo.updateCustomer({
                ...customerData,
                Id: customerId,
                SyncToken: customerData.SyncToken // Ensure to provide the latest SyncToken
            }, (err, customer) => {
                if (err) {
                    console.error('Error updating customer in QBO:', err);
                    reject(err);
                } else {
                    resolve(customer);
                }
            });
        });
    } catch (error) {
        console.error('Error in updateCustomer:', error);
        throw error;
    }
}

/**
 * Creates the data object for a bill to be sent to QuickBooks Online.
 *
 * @param {string} vendorId - The ID of the vendor for the bill.
 * @param {string} txnDate - The transaction date of the bill in YYYY-MM-DD format.
 * @param {string} dueDate - The due date of the bill in YYYY-MM-DD format.
 * @param {Array} lineItems - The line items for the bill, each with a description, amount, and other details.
 * // Example line items
        const lineItems = [
            {
                description: "Office supplies",
                amount: 150.00,
                accountRef: "78"  // Example account reference
            },
            {
                description: "Cleaning supplies",
                amount: 120.00,
                accountRef: "79"  // Example account reference
            }
        ];
 * @param {string} currencyCode - The 3-letter currency code for the bill (e.g., 'USD').
 * @returns {Object} The bill data ready to be sent to QuickBooks Online.
 */
function createBillData(vendorId, txnDate, dueDate, lineItems, currencyCode) {
  const billData = {
      VendorRef: {
          value: vendorId
      },
      TxnDate: txnDate,
      DueDate: dueDate,
      Line: lineItems.map(item => ({
          DetailType: "AccountBasedExpenseLineDetail",
          Amount: item.amount,
          Description: item.description,
          AccountBasedExpenseLineDetail: {
              AccountRef: {
                  value: item.accountRef // Assuming accountRef is provided; otherwise, this needs to be set or removed based on your QBO setup
              }
          }
      })),
      CurrencyRef: {
          value: currencyCode
      }
  };

  return billData;
}

async function createBill(qbo, billData) {
    try {
        return new Promise((resolve, reject) => {
            qbo.createBill(billData, (err, bill) => {
                if (err) {
                    console.error('Error creating bill in QBO:', err);
                    reject(err);
                } else {
                    resolve(bill);
                }
            });
        });
    } catch (error) {
        console.error('Error in createBill:', error);
        throw error;
    }
}

async function getBill(qbo, billId) {
    try {
        return new Promise((resolve, reject) => {
            qbo.getBill(billId, (err, bill) => {
                if (err) {
                    console.error('Error getting bill from QBO:', err);
                    reject(err);
                } else {
                    resolve(bill);
                }
            });
        });
    } catch (error) {
        console.error('Error in getBill:', error);
        throw error;
    }
}

async function updateBill(qbo, billId, billData) {
    try {
        return new Promise((resolve, reject) => {
            qbo.updateBill({
                ...billData,
                Id: billId,
                SyncToken: billData.SyncToken // Ensure to provide the latest SyncToken
            }, (err, bill) => {
                if (err) {
                    console.error('Error updating bill in QBO:', err);
                    reject(err);
                } else {
                    resolve(bill);
                }
            });
        });
    } catch (error) {
        console.error('Error in updateBill:', error);
        throw error;
    }
}

/**
 * Creates the data object for an invoice to be sent to QuickBooks Online.
 *
 * @param {string} customerId - The ID of the customer for the invoice.
 * @param {string} txnDate - The transaction date of the invoice in YYYY-MM-DD format.
 * @param {Array} lineItems - The line items for the invoice, each with details about the product or service.
 * // Example line items
    const lineItems = [
        {
            description: "Consulting services",
            amount: 300.00,
            itemId: "1",
            quantity: 15,
            unitPrice: 20,
            taxCodeRef: "NON"
        },
        {
            description: "Software subscription",
            amount: 500.00,
            itemId: "2",
            quantity: 10,
            unitPrice: 50,
            taxCodeRef: "TAX"
        }
    ];
 * @param {string} currencyCode - The 3-letter currency code for the invoice (e.g., 'USD').
 * @returns {Object} The invoice data ready to be sent to QuickBooks Online.
 */
function createInvoiceData(customerId, txnDate, lineItems, currencyCode, docNumber) {
    const invoiceData = {
        CustomerRef: {
            value: customerId
        },
        TxnDate: txnDate,
        Line: lineItems.map(item => ({
            DetailType: "SalesItemLineDetail",
            Amount: item.Amount,
            Description: item.Description,
            SalesItemLineDetail: item.SalesItemLineDetail
        })),
        CurrencyRef: {
            value: currencyCode
        },
        DocNumber: docNumber
    };

    return invoiceData;
}

async function createInvoice(qbo, invoiceData) {
  return new Promise((resolve, reject) => {
      qbo.createInvoice(invoiceData, (err, invoice) => {
          if (err) {
              console.error('Error creating invoice in QBO:', err);
              reject(err);
          } else {
              resolve(invoice);
          }
      });
  });
}

async function getInvoice(qbo, invoiceId) {
    console.log("getInvoiceCalled")
    return new Promise((resolve, reject) => {
        qbo.getInvoice(invoiceId, (err, invoice) => {
            if (err) {
                console.error('Error getting invoice from QBO:', err);
                reject(err);
            } else {
                resolve(invoice);
            }
        });
    });
}

async function deleteInvoice(qbo, invoiceId) {
    try {
        // First, get the invoice to find the SyncToken
        const invoice = await getInvoice(qbo, invoiceId);
        // console.log('Invoice response:', invoice);

        // Check if we successfully retrieved the invoice
        if (!invoice || !invoice.SyncToken) {
            throw new Error("Failed to retrieve the invoice or SyncToken.");
        } else {
            console.log("Invoice Retrieval Success");
        }

        // Extract the SyncToken
        const syncToken = invoice.SyncToken;

        // Now delete the invoice using the ID and SyncToken
        // console.log('QBO Object:', qbo);
        return await deleteInvoiceDirectly(qbo, invoiceId, syncToken);
    } catch (error) {
        console.error('Error in deleteInvoice function:', error);
        throw error;  // Re-throw the error for further handling if necessary
    }
}

async function deleteInvoiceDirectly(qbo, invoiceId, syncToken) {
    try {
        const response = await axios.post(
            `https://quickbooks.api.intuit.com/v3/company/${qbo.realmId}/invoice?operation=delete&minorversion=65`,
            {
                Id: invoiceId,
                SyncToken: syncToken
            },
            {
                headers: {
                    'Authorization': `Bearer ${qbo.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('Invoice deleted successfully:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error deleting invoice:', error);
        throw error;
    }
}



async function updateInvoice(qbo, invoiceId, invoiceData) {
    return new Promise((resolve, reject) => {
        // Ensure to provide the latest SyncToken which is needed to update the resource
        qbo.updateInvoice({
            ...invoiceData,
            Id: invoiceId,
            SyncToken: invoiceData.SyncToken
        }, (err, invoice) => {
            if (err) {
                console.error('Error updating invoice in QBO:', err);
                reject(err);
            } else {
                resolve(invoice);
            }
        });
    });
}

async function routeQBORequest(apiKey, method, params) {
    const qbo = await initializeQBO(apiKey);
    // Route the call based on the method
    try {
        switch (method) {
        case 'initializeQBO':
            return qbo; // return flag in production
        case 'queryQBO':
            return await qboQuery(apiKey, params); //query is an array of object with keys 'field','value' and 'operator'(optional) 
        case 'createInvoice':
            return await createInvoice(qbo, createInvoiceData(params.customerId, params.txnDate, params.lineItems, params.currencyCode, params.docNumber));
        case 'getInvoice':
            return await getInvoice(qbo, params.invoiceId);
        case 'getInvoiceByKey':
            return await getInvoice(qbo, params.key, params.value);
        case 'updateInvoice':
            return await updateInvoice(qbo, params.invoiceId, params.invoiceData);
        case 'deleteInvoice':
            return await deleteInvoice(qbo, params.invoiceId);
        case 'createBill':
            return await createBill(qbo, createBillData(params.vendorId, params.txnDate, params.dueDate, params.lineItems, params.currencyCode));
        case 'getBill':
            return await getBill(qbo, params.billId);
        case 'updateBill':
            return await updateBill(qbo, params.billId, params.billData);
        case 'getCustomer':
            return await getCustomer(qbo, params.customerId);
        case 'createCustomer':
            return await createCustomer(qbo, params.customerData);
        case 'updateCustomer':
            return await updateCustomer(qbo, params.customerId, params.customerData);
        default:
            console.error('Unsupported method:', method);
            return { error: 'Unsupported method' };
        }
    } catch (err) {
        console.error('Error routing QBO request:', err);
        return { error: 'Error routing request' };
    }
}


module.exports = {
    routeQBORequest
};
