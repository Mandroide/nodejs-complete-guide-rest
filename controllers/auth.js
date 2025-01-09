const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const env = require("dotenv")
env.config();

exports.signup = async (req, res, next) => {
    try {
        const email = req.body.email;
        const name = req.body.name;
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        const user = await new User(
            {
                email: email,
                name: name,
                password: hashedPassword
            }).save();
        res.status(201).json({userId: user._id});
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }
}

function checkIfMeetsCondition(meetConditions) {
    if (!meetConditions) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }
}

exports.login = async (req, res, next) => {
    try {
        const user = await User.findOne({email: req.body.email});
        checkIfMeetsCondition(user);
        const isEqual = await bcrypt.compare(req.body.password, user.password);
        checkIfMeetsCondition(isEqual);
        const userId = user._id.toString();
        jsonwebtoken.sign({
            email: user.email, userId: userId,
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h',
        }, (err, token) => {
            if (err) return next(err);
            res.status(200).json({
                token: token,
                userId: userId,
            })
        });
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
        return err;
    }
}