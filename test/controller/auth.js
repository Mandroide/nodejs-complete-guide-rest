const expect = require('chai').expect;
const sinon = require('sinon');
const User = require('../../models/user');
const authController = require('../../controllers/auth');

describe('Auth Controller - Login', () => {
    it('should throw an error if accessing the database fails', async () => {
        sinon.stub(User, 'findOne');
        User.findOne.throws()
        const req = {
            body: {
                email: 'test@test.com',
                password: 'test123'
            }
        };
        const res = {};
        const next = () => {
        };
        const result = await authController.login(req, res, next)
        expect(result).to.be.an('error');
        expect(result).to.have.property('status', 500);
        User.findOne.restore()

    })
});