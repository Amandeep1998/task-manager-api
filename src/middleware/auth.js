const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const auth = async(req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '') ;//Get token from the header;    
        const decoded =  jwt.verify(token, process.env.JWT_SECRET);  //verify the token
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})//token contains the id of the user and we check wheter the user is login or not by verifying token is present in tokens array or not.
        if(!user) {
            throw new Error()
        }
        req.user = user;
        req.token = token;
        next();
    } catch (e) {

        res.status(401).send({error: 'Please Authenticate'});
    }
}

module.exports = auth;
