require('dotenv').config();
const { sendSMS } = require('./app/integrations/twilio');

try{
    // sendSMS(+17786783674, `testing text to me`)
} catch(error) {
    console.error(error.message)
}