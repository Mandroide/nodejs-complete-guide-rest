const expect = require('chai').expect;
const authMiddleware = require('../../middleware/auth');
const jwt = require("jsonwebtoken");
const sinon = require('sinon');

describe('Auth middleware', () => {
    it('should throw an error if authorization header is not present', () => {
        const req = {
            headers: {}
        };
        const res = {};
        const next = () => {};
        expect(() => authMiddleware.rejectIfInvalidToken(req, res, next)).to.throw('Not authenticated')
            .which.has.property('status', 401);
    });

    it('should throw an error if token cannot be verified', () => {
        const req = {
            headers: {
                authorization: 'Bearer xyz'
            }
        };
        const res = {};
        const next = () => {};
        expect(() => authMiddleware.rejectIfInvalidToken(req, res, next)).to.throw(jwt.JsonWebTokenError)
            .which.has.property('status', 400);
    });

    it('should yield a userId after decoding the token', () => {
        const req = {
            headers: {
                authorization: 'Bearer xyz'
            }
        };
        sinon.stub(jwt, 'verify');
        jwt.verify.returns({userId: 'abc'});
        const res = {};
        const next = () => {};
        authMiddleware.rejectIfInvalidToken(req, res, next)
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    });
});
