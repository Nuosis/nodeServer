const stripe = require('stripe');
const { findRecord } = require('../../../dataAPI/functions');
const { deTokenize,  } = require('../../auth/security');
const { findRecordsSQL } = require('../../../SQLite/functions');
const access = require('../../../dataAPI/access');

async function routeStripeRequest(apiKey, method, params) {
    // Extract company idFilemaker using the apiKey
    const companyQueryConditions = [{apiKey}];
    const companyIdFilemaker = await findRecordsSQL('company', companyQueryConditions);

    if (!companyIdFilemaker) {
        console.error('Company not found for apiKey:', apiKey);
        return { error: 'Company not found' };
    }

    // Acquire token for FileMaker Data API access
    const userName = process.env.DEVun;
    const password = process.env.DEVpw;
    const server = "server.claritybusinesssolutions.ca";
    const database = "clarityData";
    let layout = ""
    let response = ""
    let query = ""
    let token;
    try {
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        // Query FileMaker to retrieve stripeKey
        query = [{ '_orgID': companyIdFilemaker[0].id, 'moduleName': 'STRIPE','f_active': 1 }];
        layout = 'dapiModulesSelected'; // should use modulesSelected (store tokenized apiKeys there)
        response = await findRecord(server, database, layout, token, { query });
        //console.log(response.response.data)

        if (!response.response || !response.response.data || !response.response.data[0] || !response.response.data[0].fieldData) {
            console.error('Stripe Module ID not found');
            return { error: 'Stripe module not found. Either the ordID is worong on Stripe is no longer active' };
        }
        const stripeKeyId = response.response.data[0].fieldData["__ID"]
        //console.log(stripeKeyId)
        query = [{ '_fkID': stripeKeyId }];
        layout = 'dapiRecordDetails';
        response = await findRecord(server, database, layout, token, { query });

        // Extract and decode the stripeKey
        const stripeToken = JSON.parse(response.response.data[0].fieldData.data);
        //console.log(stripeToken)
        const stripeKeyData = deTokenize(stripeToken.token);
        //console.log({stripeKeyData})
        const stripeKey = stripeKeyData.decoded.data.secret;
        //console.log({stripeKey})

        // Route the call based on the method
        switch (method) {
            case 'createPaymentIntent':
                return createPaymentIntent(stripeKey, params.amount, params.currency, params.customerId)
            case 'processPayment':
                return processPayment(stripeKey, params.paymentMethodId, params.amount, params.currency);
            case 'refundPayment':
                return refundPayment(stripeKey, params.paymentIntentId);
            case 'retrievePaymentDetails':
                return retrievePaymentDetails(stripeKey, params.paymentIntentId);
            case 'addCustomer':
                return addCustomer(stripeKey, params.email, params.name);
            case 'findCustomer':
                return getCustomer(stripeKey, params.email);
            case 'updateCustomer':
                return updateCustomer(stripeKey, params.customerId, params.updateParams);
            case 'hasValidCard':
                return hasValidCard(stripeKey, params.customerId);
            case 'addPaymentMethod':
                return addPaymentMethod(stripeKey, params.customerId, params.paymentMethodId);
            case 'createSubscription':
                return createSubscription(stripeKey, params.customerId, params.priceId);
            case 'cancelSubscription':
                return cancelSubscription(stripeKey, params.subscriptionId);
            case 'listSubscriptions':
                return listSubscriptions(stripeKey, params.customerId);
            case 'retrieveSubscription':
                return retrieveSubscription(stripeKey, params.subscriptionId);
            default:
                console.error('Unsupported method:', method);
                return { error: 'Unsupported method' };
        }
        
    } catch (err) {
        console.error('Error routing request:', err);
        return { error: 'Error routing request' };
    } finally {
        // Release the FileMaker token
        if (token) {
            await access.releaseFileMakerToken(server, database, token);
        }
    }
}


//CUSTOMERS
// Function to get a customer by email
async function getCustomer(stripeKey, email) {
    const stripe = require('stripe')(stripeKey);
    try {
        // Search for customers with the specified email
        const customers = await stripe.customers.search({
            query: `email:'${email}'`,
        });
        // Check if we found any customers
        if (customers.data.length > 0) {
            // Return the first matching customer
            return customers.data[0];
        } else {
            // No customer found with that email
            console.log('No customer found with that email');
            return null;
        }
    } catch (err) {
        console.error('Failed to retrieve customer:', err);
        throw new Error('Failed to retrieve customer');
    }
}

//add customer
async function addCustomer(stripeKey, email, name) {
    const stripe = require('stripe')(stripeKey);

    try {
        const customer = await stripe.customers.create({
            email,
            name,
        });

        return customer;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to add customer');
    }
}

//update customer
async function updateCustomer(stripeKey, customerId, updateParams) {
    const stripe = require('stripe')(stripeKey);

    try {
        const customer = await stripe.customers.update(customerId, updateParams);

        return customer;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to update customer');
    }
}

//get customer has valid cc
async function hasValidCard(stripeKey, customerId) {
    const stripe = require('stripe')(stripeKey);
    //console.log(customerId)
    try {
        // Retrieve the list of payment methods for the customer
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });
        //console.log({paymentMethods})

        // Check if there are any valid card payment methods
        if (paymentMethods.data.length > 0) {
            return true; // Customer has a valid card on file
        } else {
            return false; // Customer does not have a valid card on file
        }
    } catch (error) {
        console.error('Error checking payment methods:', error);
        throw new Error('Failed to check payment methods');
    }
}

//PAYEMNTS
async function addPaymentMethod(stripeKey, customerId, paymentMethodId) {
    const stripe = require('stripe')(stripeKey);

    try {
        // Attach the existing payment method to the customer
        // console.log("paymentMethodId: ",paymentMethodId)
        const attachedPaymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });
        console.log("attachedPaymentMethod: ", attachedPaymentMethod)
        return attachedPaymentMethod;
    } catch (err) {
        console.error('Failed to add payment method:', err);
        throw new Error('Failed to add payment method');
    }
}

// Function to create a payment intent
async function createPaymentIntent(stripeKey, amount, currency, customerId = null) {
    const stripeInstance = stripe(stripeKey);

    try {
        const paymentIntentParams = {
            amount,
            currency,
        };

        if (customerId) {
            paymentIntentParams.customer = customerId;
        }

        const paymentIntent = await stripeInstance.paymentIntents.create(paymentIntentParams);

        return { clientSecret: paymentIntent.client_secret };
    } catch (err) {
        console.error(err);
        throw new Error('Failed to create payment intent');
    }
}

//Take Payment
async function processPayment(stripeKey, paymentMethodId, amount, currency) {
    const stripe = require('stripe')(stripeKey);

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            payment_method: paymentMethodId,
            amount,
            currency,
            confirm: true,
        });

        return paymentIntent;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to process payment');
    }
}

//REFUND
async function refundPayment(stripeKey, paymentIntentId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
        });

        return refund;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to refund payment');
    }
}


//RETREIEVE PAYMENT DETAILS
async function retrievePaymentDetails(stripeKey, paymentIntentId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        return paymentIntent;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to retrieve payment details');
    }
}

//SUBSCRIPTIONS
async function createSubscription(stripeKey, customerId, priceId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [{ price: priceId }],
        });

        return subscription;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to create subscription');
    }
}

async function cancelSubscription(stripeKey, subscriptionId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const subscription = await stripe.subscriptions.del(subscriptionId);

        return subscription;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to cancel subscription');
    }
}

async function listSubscriptions(stripeKey, customerId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
        });

        return subscriptions;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to list subscriptions');
    }
}

async function retrieveSubscription(stripeKey, subscriptionId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        return subscription;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to retrieve subscription');
    }
}


module.exports = {
    routeStripeRequest
};