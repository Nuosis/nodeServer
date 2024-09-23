require('dotenv').config();
const twilio = require('twilio');
const twilioSID = process.env.TWILIO_ACCOUNT_SID;
const twilioAUTH = process.env.TWILIO_AUTH_TOKEN;
const twilioNUM = process.env.TWILIO_PHONE_NUMBER;
const devNUM = process.env.DEV_NUMBER;
if (!twilioSID || !twilioAUTH || !twilioNUM || !devNUM) {
    throw new Error('Required environmental variable twilioAUTH, twilioSID, twilioNUM or devNUM is undefined');
}
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS(to, body) {
    client.messages.create({
        body: body,
        to: to,  // Text this number
        from: twilioNUM // From a valid Twilio number
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error));
}


module.exports = {
    sendSMS
};