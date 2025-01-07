const User = require("../models/user");
exports.getStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (user) {
            res.status(200).json({
                status: user.status
            })
        } else {
            const err = new Error('Not Found!');
            err.status = 404;
            next(err);
        }
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }
};

exports.patchStatus = async (req, res, next) => {
    try {
        const status = req.body.status;
        const user = await User.findById(req.userId);
        if (user) {
            user.status = status;
            await user.save();
            res.status(200).json({
                status: user.status
            });
        } else {
            const err = new Error('Not Found!');
            err.status = 404;
            next(err);
        }
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }
};