const User = require("../models/user");
exports.getStatus = (req, res, next) => {
    User.findById(req.userId).then((user) => {
        if (user) {
            res.status(200).json({
                status: user.status
            })
        } else {
            const error = new Error('Not Found!');
            error.status = 404;
            throw error;
        }
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    });
};

exports.patchStatus = (req, res, next) => {
    const status = req.body.status;
    User.findById(req.userId).then((user) => {
        if (user) {
            user.status = status;
            return user.save();
        } else {
            const error = new Error('Not Found!');
            error.status = 404;
            throw error;
        }
    }).then(user => res.status(200).json({
        status: user.status
    })).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    });
};