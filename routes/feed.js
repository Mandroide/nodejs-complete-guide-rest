const express = require('express');
const router = express.Router();
const feedSanitizer = require('../sanitizers/feed')
const feedValidator = require('../validators/feed')
const globalMiddleware = require('../middleware/global')
const authMiddleware = require('../middleware/auth')
const controller = require('../controllers/feed');

router.get('/posts', authMiddleware.rejectIfInvalidToken, controller.getPosts);
router.post('/posts', authMiddleware.rejectIfInvalidToken, feedSanitizer.createPost, feedValidator.createPost, globalMiddleware.rejectIfValidationFails, controller.createPost);
router.get('/posts/:postId', authMiddleware.rejectIfInvalidToken, feedValidator.getPost, controller.getPost);
router.put('/posts/:postId', authMiddleware.rejectIfInvalidToken, feedSanitizer.updatePost, feedValidator.updatePost, globalMiddleware.rejectIfValidationFails, controller.updatePost);
router.delete('/posts/:postId', authMiddleware.rejectIfInvalidToken, feedValidator.deletePost, globalMiddleware.rejectIfValidationFails, controller.deletePost);

module.exports = router;