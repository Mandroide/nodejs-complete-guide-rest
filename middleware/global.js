const {validationResult} = require('express-validator')

module.exports.rejectIfValidationFails = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        let message;
        for (const error of errors.array()) {
            message = `${error.path}::${error.msg}, `;
        }
        message = message.substring(0, message.length - 2);
        const error = new Error(message);
        error.status = 422;
        next(error);
    } else {
        next();
    }
}