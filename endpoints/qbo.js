const { verifyToken } = require('../auth/security');
const {routeQBORequest} = require('../QBO/functions');

module.exports = function (app) {
    // Endpoint to handle Stripe requests
    app.post('/qbo', verifyToken, async (req, res) => {
        console.log(`${new Date().toISOString()} /qbo`)
        try {
            // Extract apiKey, method, and params from request body
            const { method, params } = req.body;
            console.log(method, params.query)
            //console.log({params})
            const apiKey = req.user.apiKey

            // Validate apiKey and method
            if (!apiKey || !method) {
                return res.status(400).json({ error: 'Missing apiKey or method' });
            }

            // Call routeRequest function
            const result = await routeQBORequest(apiKey, method, params);

            // Send response
            res.status(200).json(result);
        } catch (err) {
            console.error('Error processing request:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
};