exports.authCheck = function (req) {
    if (!req.isAuth) {
        const error = new Error('Not authenticated');
        error.status = 401;
    }
}