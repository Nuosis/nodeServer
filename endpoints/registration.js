require('dotenv').config();
const { verifyToken, verifyPassword } = require('../auth/security');
const { sendVerificationEmail } = require('../emailTemplates/verification');
const { createRecordSQL, findRecordsSQL } = require('../SQLite/functions');

module.exports = function (app) {
    // SEND VERIFICATION EMAIL
    app.get('/send_verification', verifyToken, async (req, res) => {
        try {
            const username = req.user
            const verificationUrl = process.env.WEBHOOKhost + '/email_verification'; // Replace with actual URL
            const emailSent = await sendVerificationEmail(username, verificationUrl);

            if (emailSent) {
                res.status(200).json({ message: 'Email sent' });
            } else {
                // If sendVerificationEmail indicates failure
                res.status(500).json({ message: 'Failed to send email' });
            }
        } catch (err) {
            // If there's an error in sending the email, return an error response
            res.status(500).json({ message: 'Error in sending email', error: err.message });
        }
    });


    // Email Verification endpoint
    app.get('/email_verification', verifyToken, (req, res) => {
        const apiKey = req.user.apiKey;
        findRecordsSQL('users', [{ apiKey: apiKey }])
        .then(records => {
            if (records.length > 0) {
            // If records are found
            modifyAll('users', [{ apiKey: apiKey }], { verified: 1 })
                .then(() => {
                // Modification successful, return success response
                res.status(200).json({ message: 'Email verified successfully', records: records });
                })
                .catch(err => {
                // Error in modification, return an error response
                res.status(500).json({ message: 'Error in modifying records', error: err });
                });
            } else {
            // If no records are found, return a not found response
            res.status(404).json({ message: 'No records found' });
            }
        })
        .catch(err => {
            // If there's an error in finding records, return an error response
            res.status(403).json({ message: 'Error in accessing records', error: err });
        });
    });
};