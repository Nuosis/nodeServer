require('dotenv').config();
const twilio = require('twilio');
const { sendSMS } = require('./twilio/sms');

try{
    sendSMS(+17786783674, `testing text to me`)
} catch(error) {
    console.error(error.message)
}