const {body} = require('express-validator');

exports.signup = [
    body('email').normalizeEmail(),
    body('name').trim()
]

exports.login = [
    body('email').normalizeEmail()
]