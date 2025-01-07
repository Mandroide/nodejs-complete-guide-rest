const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth')
const controller = require('../controllers/user');
const userSanitizer = require('../sanitizers/user')
const userValidator = require('../validators/user')
const globalMiddleware = require('../middleware/global')

router.get('/status', authMiddleware.rejectIfInvalidToken, controller.getStatus);
router.patch('/status', authMiddleware.rejectIfInvalidToken, userSanitizer.patchStatus, userValidator.patchStatus,
    globalMiddleware.rejectIfValidationFails, controller.patchStatus);

module.exports = router;