const jwt = require('jsonwebtoken')
const config = require('config')


// it take a three arguments request, response, next
module.exports = function(req, res, next) {
    //get token from header
    const token = req.header('x-auth-token');

    // check if not token
    if(!token) {
        // 401 --> not authorized
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // verify token
    try {
        // decode the token
        const decoded = jwt.verify(token, config.get('jwtSecret'));

        req.user = decoded.user;
        next();
    } catch(err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
} 