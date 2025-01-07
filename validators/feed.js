const {body, param} = require("express-validator");

exports.createPost = [
    body("title").isLength({min: 5}),
    body("content").isLength({min: 5})
];

exports.getPost = [
    param("postId").isMongoId()
];

exports.updatePost = [
    param("postId").isMongoId(),
    body("title").isLength({min: 5}),
    body("content").isLength({min: 5})
];

exports.deletePost = [
    param("postId").isMongoId()
];