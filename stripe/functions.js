const stripe = require('stripe');
const { getFileMakerToken ,releaseFileMakerToken} = require('../dataAPI/access');
const { findRecord } = require('../dataAPI/functions');
const {deTokenize} = require('../auth/security');
const {findRecordsSQL} = require('../SQLite/functions');

export async function routeStripeRequest(apiKey, method, params) {
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
    let token;
    try {
        token = await access.getFileMakerToken(server, database, userName, password);
        if (!token) {
            console.error('Failed to acquire FileMaker token');
            return { error: 'Failed to acquire FileMaker token' };
        }

        // Query FileMaker to retrieve stripeKey
        const query = [{ '_orgID': companyIdFilemaker },{ 'moduleName': 'STRIPE' },{ 'f_active': 1 }];
        const layout = 'dapiModuleSelected'; // should use modulesSelected (store tokenized apiKeys there)
        const response = await findRecord(server, database, layout, token, { query });

        if (!response || !response.data || !response.data[0] || !response.data[0].fieldData || !response.data[0].fieldData.stripeKey) {
            console.error('Stripe key not found in response');
            return { error: 'Stripe key not found' };
        }

        // Extract and decode the stripeKey
        const stripeKey = deTokenize(response.data[0].fieldData.stripeKey);

        // Route the call based on the method
        switch (method) {
            case 'createPaymentIntent':
                return createPaymentIntent(stripeKey, params.amount, params.currency)
            case 'processPayment':
                return processPayment(stripeKey, params.paymentMethodId, params.amount, params.currency);
            case 'refundPayment':
                return refundPayment(stripeKey, params.paymentIntentId);
            case 'retrievePaymentDetails':
                return retrievePaymentDetails(stripeKey, params.paymentIntentId);
            case 'addCustomer':
                return addCustomer(stripeKey, params.email, params.name);
            case 'updateCustomer':
                return updateCustomer(stripeKey, params.customerId, params.updateParams);
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
            await releaseFileMakerToken(server, database, token);
        }
    }
}

module.exports = routeStripeRequest;


//CUSTOMERS

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



//PAYEMNTS

//add payment method
async function addPaymentMethod(stripeKey, customerId, paymentMethodId) {
    const stripe = require('stripe')(stripeKey);

    try {
        const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        return paymentMethod;
    } catch (err) {
        console.error(err);
        throw new Error('Failed to add payment method');
    }
}


// Function to create a payment intent
async function createPaymentIntent(stripeKey, amount, currency) {
    const stripeInstance = stripe(stripeKey);

    try {
        const paymentIntent = await stripeInstance.paymentIntents.create({
            amount,
            currency,
        });

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
