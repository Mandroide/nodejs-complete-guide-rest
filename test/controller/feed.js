const expect = require('chai').expect;
const User = require('../../models/user');
const Post = require('../../models/post');
const feedController = require('../../controllers/feed');
const mongoose = require('mongoose');
const env = require("dotenv")
env.config({
    path: '.env.test.local'
});

describe('Feed Controller', () => {
    const userId = '677e8e59d20584838f2c3998';

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
    })

    it('should add a created post to the posts of the creator', async () => {
        try {

            const req = {
                body: {
                    title: 'Test Post',
                    content: 'A Test Post'
                },
                file: {
                    path: 'abc'
                },
                userId: userId
            };
            const res = {
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


            await feedController.createPost(req, res, next);
            const user = await User.findById(userId)
            expect(user.posts).to.have.lengthOf(1);
        } catch (err) {
            console.log(err);
        }

    })

    after(async () => {
        await Post.deleteMany()
        await User.deleteMany();
        await mongoose.disconnect()
    })
});