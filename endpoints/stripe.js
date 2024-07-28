const { verifyToken } = require('../auth/security');
const {routeStripeRequest} = require('../stripe/functions');

module.exports = function (app) {
    // Endpoint to handle Stripe requests
    app.post('/stripe', verifyToken, async (req, res) => {
        console.log('/stripe')
        try {
            // Extract apiKey, method, and params from request body
            const { method, params } = req.body;
            console.log('method: ',method)
            const apiKey = req.user.apiKey

            // Validate apiKey and method
            if (!apiKey || !method) {
                return res.status(400).json({ error: 'Missing apiKey or method' });
            }

            // Call routeRequest function
            const result = await routeStripeRequest(apiKey, method, params);
            // Send response
            res.status(200).json(result);
        } catch (err) {
            console.error('Error processing request:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};