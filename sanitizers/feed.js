const {body} = require("express-validator");

exports.createPost = [
    body("title").trim(),
    body("content").trim(),
]

exports.updatePost = [
    body("title").trim(),
    body("content").trim(),
]