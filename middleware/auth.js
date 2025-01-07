const User = require('../models/user');
const jsonwebtoken = require('jsonwebtoken');
const env = require("dotenv")
env.config();

module.exports.rejectIfUserAlreadyExists = (req, res, next) => {
    User.findOne({email: req.body.email}).then(user => {
        if (user) {
            const error = new Error('User already exists');
            error.status = 422;
            throw error;
        }
        next();
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    })
}

function checkIfAuthenticationIsValid(meetCondition) {
    if (!meetCondition) {
        const error = new Error('Not authorized');
        error.status = 401;
        throw error;
    }
}

module.exports.rejectIfInvalidToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    checkIfAuthenticationIsValid(authHeader);
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jsonwebtoken.verify(token, process.env.JWT_SECRET_KEY);
    } catch (err) {
        err.status = 500;
        throw err;
    }
    checkIfAuthenticationIsValid(decodedToken);
    req.userId = decodedToken.userId;
    next();
}