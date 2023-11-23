require('dotenv').config();
const mailjet = require('node-mailjet').connect(process.env.MAILJETapi, process.env.MAILJETsecret);
const fs = require('fs');

// Function to read the HTML template and replace placeholders
function prepareEmailTemplate(filePath, replacements) {
    let htmlContent = fs.readFileSync(filePath, 'utf8');

    Object.keys(replacements).forEach(key => {
        htmlContent = htmlContent.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
    });

    return htmlContent;
}

async function sendVerificationEmail(emailAddress, verificationUrl) {

    const emailHtml = prepareEmailTemplate('./emailTemplates/verify.html', {
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

    try {
        const request = await mailjet.post("send", { 'version': 'v3.1' }).request(emailData);
        console.log(request.body);
    } catch (err) {
        console.error(err.statusCode);
    }
}

module.exports = {
    sendVerificationEmail
};