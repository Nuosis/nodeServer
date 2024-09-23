function accessController() {
    
    this.login = function (req, res) {
        res.send('login user working');
    }

    this.verifyUser = function (req, res) {
        res.status(200).json({ message: 'Verify user API working' });
    }

    this.githubWebhook = function (req, res) {
        res.status(200).json({ message: 'Github webhook end-point working' });
    }
}

module.exports = new accessController();