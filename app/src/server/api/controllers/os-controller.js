const os = require('os');


exports.getUsername = (req, res) => {
    res.send({ username: os.userInfo().username });
}