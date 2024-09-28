function basicController() {
    
    this.index = function (req, res) {
        res.send('Server is looking up');
    }

    this.verifyToken = function (req, res) {
        res.status(200).json({ message: 'Access validated successfully' });
    }


}

module.exports = new basicController();