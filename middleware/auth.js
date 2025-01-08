const User = require('../models/user');
const jsonwebtoken = require('jsonwebtoken');
const env = require("dotenv")
env.config();

module.exports.rejectIfInvalidToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        req.isAuth = false;
        return next();
    }
    if (!decodedToken) {
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
}