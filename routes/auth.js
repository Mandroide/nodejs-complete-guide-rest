const express = require("express");
const router = express.Router();
const controller = require('../controllers/auth');
const authValidator = require('../validators/auth');
const authSanitizer = require('../sanitizers/auth');
const globalMiddleware = require('../middleware/global')
const authMiddleware = require('../middleware/auth')

router.post('/signup', authSanitizer.signup, authValidator.signup, globalMiddleware.rejectIfValidationFails,
    authMiddleware.rejectIfUserAlreadyExists, controller.signup);

router.post('/login', authSanitizer.login, authValidator.login, globalMiddleware.rejectIfValidationFails,
    controller.login);

module.exports = router;