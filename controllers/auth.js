const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const env = require("dotenv")
env.config();

exports.signup = (req, res, next) => {
    const email = req.body.email;
    const name = req.body.name;
    bcrypt.hash(req.body.password, 12).then(hashedPassword => {
        const user = new User(
            {
                email: email,
                name: name,
                password: hashedPassword
            }
        );
        return user.save();
    }).then(user => {
        res.status(201).json({userId: user._id});
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    })
}

function checkIfMeetsCondition(meetConditions) {
    if (!meetConditions) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }
}

exports.login = (req, res, next) => {
    let loadedUser;
    User.findOne({email: req.body.email}).then(user => {
        checkIfMeetsCondition(user);
        loadedUser = user;
        return bcrypt.compare(req.body.password, user.password)
    }).then(isEqual => {
        checkIfMeetsCondition(isEqual);
        const userId = loadedUser._id.toString();
        jsonwebtoken.sign({
            email: loadedUser.email, userId: userId,
        }, process.env.JWT_SECRET_KEY, {
            expiresIn: '1h',
        }, (err, token) => {
            if (err) return next(err);
            res.status(200).json({
                token: token,
                userId: userId,
            })
        });

    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    })
}