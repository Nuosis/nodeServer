require('dotenv').config();

const COMPANY = process.env.COMPANY; 
if (!COMPANY) {
    throw new Error('Required environmental variable is undefined');
}
const COMPANYemail = process.env.COMPANYemail;
if (!COMPANYemail) {
    throw new Error('Required environmental variable is undefined');
}
const MAILJETapi = process.env.MAILJETapi;
if (!MAILJETapi) {
    throw new Error('Required environmental variable is undefined');
}
const MAILJETsecret = process.env.MAILJETsecret;
if (!MAILJETsecret) {
    throw new Error('Required environmental variable is undefined');
}
const mailjet = require('node-mailjet').apiConnect(process.env.MAILJETapi, process.env.MAILJETsecret);
const fs = require('fs').promises;

// Function to read the HTML template and replace placeholders
async function prepareEmailTemplate(filePath, replacements) {
    try {
        let htmlContent = await fs.readFile(filePath, 'utf8');

        Object.keys(replacements).forEach(key => {
            htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
        });

        return htmlContent;
    } catch (err) {
        console.error('Error reading email template:', err);
        throw err; // Rethrow the error to be handled by the caller
    }
}


async function sendVerificationEmail(emailAddress, verificationUrl) {
    console.log('verificationURL:', verificationUrl)
    const emailHtml = await prepareEmailTemplate('./emailTemplates/verify.html', {
        YEAR: new Date().getFullYear(),
        COMPANY: process.env.COMPANY,
        URL: verificationUrl
    });

    const emailData = {
        "Messages": [
            {
                "From": {
                    "Email": process.env.COMPANYemail,
                    "Name": process.env.COMPANY
                },
                "To": [
                    {
                        "Email": emailAddress
                    }
                ],
                "Subject": "Email Verification Required",
                "HTMLPart": emailHtml
            }
        ]
    };

    console.log('emailData:', emailData)

    try {
        await mailjet.post("send", { 'version': 'v3.1' }).request(emailData);
        console.log("Email sent successfully");
        return true; // Indicate success
    } catch (err) {
        console.error(err);
        return false; // Indicate failure
    }
}

module.exports = {
    sendVerificationEmail
};