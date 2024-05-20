const { tokenize, deTokenize } = require('../auth/security');


module.exports = function (app) {
    app.post('/tokenize', (req, res) => {
        console.log(`${new Date().toISOString()} /tokenize called`)
        data = req.body
        console.log(data)
        const token = tokenize(data); // Implement this function to generate a unique token
        res.send({ token }); // Send back the token to the client
    });

    app.get('/getTokenData', (req, res) => {
        console.log(`${new Date().toISOString()} /deTokenize called`)
        const { token } = req.query;
        const data = deTokenize(token)
        res.send(data || {});
    });
}
