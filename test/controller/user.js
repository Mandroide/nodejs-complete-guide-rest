const expect = require('chai').expect;
const userController = require('../../controllers/user');
const User = require('../../models/user');
const mongoose = require('mongoose');
const env = require("dotenv")
env.config({
    path: '.env.test.local'
});

describe('User Controller - Get Status', () => {
    before(async () => {
        await mongoose.connect(process.env.DB_URI, {
            w: 'majority',
            appName: process.env.DB_APP_NAME,
            retryWrites: true,
            authSource: process.env.DB_AUTH_SOURCE,
            dbName: process.env.DB_NAME,
            user: process.env.DB_USER,
            pass: process.env.DB_PASSWORD
        });
    })

    it('should send a response with a valid user status for an existing user', async () => {
        try {
            const userId = '677e8e59d20584838f2c3998';
            const user = new User(
                {
                    email: 'test@test.com',
                    password: 'tester',
                    name: 'test',
                    posts: [],
                    _id: userId
                }
            );
            await user.save()
            const req = {
                userId: userId
            };
            const res = {
                userStatus: null,
                status: function (code) {
                    this.status = code;
                    return this;
                },
                json: function (data) {
                    this.userStatus = data.status;
                    return this;
                }
            };
            const next = () => {
            };


            await userController.getStatus(req, res, next);
            expect(res.status).to.equal(200);
            expect(res.userStatus).to.equal('I am new!');
        } catch (err) {
            console.log(err);
        }

    })

    after(async () => {
        await User.deleteMany({});
        await mongoose.disconnect()
    })
});