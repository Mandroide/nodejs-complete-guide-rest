const {body} = require('express-validator');

exports.signup = [
    body('email').isEmail(),
    body('name').isLength({min: 4}),
    body('password').isStrongPassword(),
]

exports.login = [
    body('email').isEmail()
]