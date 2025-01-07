const {body} = require("express-validator");
exports.patchStatus = [
    body("status").trim()
];