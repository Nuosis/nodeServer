require('dotenv').config();
const twilio = require('twilio');

// Validate required environment variables
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, DEV_NUMBER } = process.env;
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || !DEV_NUMBER) {
    throw new Error('Missing one or more required environment variables: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, DEV_NUMBER');
}

// Initialize Twilio client
const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

async function sendSMS(to, body) {
    client.messages.create({
        body: body,
        to: to,  // Text this number
        from: TWILIO_PHONE_NUMBER // From a valid Twilio number
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error));
}

module.exports = {
    sendSMS
};