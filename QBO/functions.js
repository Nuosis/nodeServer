const QuickBooks = require('node-quickbooks');
const { runScript } = require('../dataAPI/functions');
const {findRecordsSQL} = require('../SQLite/functions');
const access = require('../dataAPI/access');
const axios = require('axios');

// Assuming access.getFileMakerToken and releaseFileMakerToken are defined elsewhere


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
    const layout = 'dapiModuleSelected'; // Store tokenized apiKeys there
    let token;

    try {
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        const query = [{ '_orgID': companyIdFilemaker }, { 'moduleName': 'QBO' }, { 'f_active': 1 }];
        const response = await findRecord(server, database, layout, token, { query });

        if (!response || !response.data || !response.data[0] || !response.data[0].fieldData) {
            console.error('QBO Module ID not found');
            return { error: 'QBO module not found. Either the orgID is wrong or QBO is no longer active' };
        }

        const moduleID = response.data[0].fieldData["__ID"];

        const params = {
            scriptName: 'qb . refreshToken',
            scriptParameters: {
                orgID: companyIdFilemaker,
                recordID: moduleID,
                returnFull: true
            }
        };

        const scriptResult = await runScript(server, database, layout, token, params);
        console.log('Script Result:', scriptResult);
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
        const qboConfig = await configQBO(apiKey);
        console.log('qboConfig:', qboConfig);
        const qbo = new QuickBooks(
            qboConfig.client.ID,
            qboConfig.client.Secret,
            qboConfig.access.Token,
            false, // no token secret for OAuth2
            qboConfig.realm.ID,
            true, // use the sandbox?
            true, // enable debugging?
            null, // set minorversion, or null
            '2.0', // OAuth version
            qboConfig.refresh.Token,
            qboConfig.environment // production or sandbox
        );
        return qbo;
    } catch (error) {
        console.error('Failed to initialize QBO:', error);
        throw error;
    }
}

async function queryQBO(apiKey, tableName, whereClause) {
    try {
        const qbo = await initializeQBO(apiKey);
        const query = `SELECT * FROM ${tableName} WHERE ${whereClause}`;

        return new Promise((resolve, reject) => {
            qbo.query(query, (err, queryResult) => {
                if (err) {
                    console.error('Error querying data from QBO:', err);
                    reject(err);
                } else {
                    resolve(queryResult);
                }
            });
        });
    } catch (error) {
        console.error('Error in queryQBO:', error);
        throw error;
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
function createInvoiceData(customerId, txnDate, lineItems, currencyCode) {
  const invoiceData = {
      CustomerRef: {
          value: customerId
      },
      TxnDate: txnDate,
      Line: lineItems.map(item => ({
          DetailType: "SalesItemLineDetail",
          Amount: item.amount,
          Description: item.description,
          SalesItemLineDetail: {
              ItemRef: {
                  value: item.itemId
              },
              Qty: item.quantity,
              UnitPrice: item.unitPrice,
              TaxCodeRef: item.taxCodeRef ? { value: item.taxCodeRef } : undefined
          }
      })),
      CurrencyRef: {
          value: currencyCode
      }
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
      case 'queryQBO':
          return await queryQBO(qbo, params.tableName, params.whereClause);
      case 'createInvoice':
          return await createInvoice(qbo, createInvoiceData(params.customerId, params.txnDate, params.lineItems, params.currencyCode));
      case 'getInvoice':
          return await getInvoice(qbo, params.invoiceId);
      case 'updateInvoice':
          return await updateInvoice(qbo, params.invoiceId, params.invoiceData);
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
