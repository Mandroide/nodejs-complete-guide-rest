const bcrypt = require('bcryptjs')
const jsonwebtoken = require('jsonwebtoken')
const validator = require('validator');
const User = require('../models/user');
const Post = require("../models/post");
const file = require("../util/file");
const check = require('../util/check');
const env = require("dotenv")
env.config();

function validateUser(userInput) {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
        errors.push({
            message: 'Email is invalid',
        });
    }

    if (!validator.isStrongPassword(userInput.password)) {
        errors.push({
            message: 'Password is invalid',
        })
    }

    if (errors.length > 0) {
        const error = new Error('Invalid input');
        error.data = errors;
        error.status = 422
        throw error;
    }
}

exports.createUser = async function ({userInput}, req) {
    validateUser(userInput);
    const existingUser = await User.findOne({email: userInput.email});
    if (existingUser) {
        const error = new Error('User already exists!');
        error.status = 422;
        throw error;
    } else {
        const hashedPassword = await bcrypt.hash(userInput.password, 12);
        const user = await new User({
            email: userInput.email,
            name: userInput.name,
            password: hashedPassword,
        }).save()
        return {...user._doc, _id: user._id.toString()};
    }
}

function verifyAuthentication(credential) {
    if (!credential) {
        const error = new Error('Invalid credentials');
        error.status = 401;
        throw error;
    }
}

exports.login = async function ({email, password}, req) {
    const user = await User.findOne({email: email});
    verifyAuthentication(user);
    const isEqual = await bcrypt.compare(password, user.password);
    verifyAuthentication(isEqual);
    const token = jsonwebtoken.sign({
        userId: user._id.toString(),
        email: user.email
    }, process.env.JWT_SECRET_KEY, {
        expiresIn: '1h',
    });

    return {
        token: token,
        userId: user._id.toString()
    }
}

function validatePost(postInput) {
    const errors = [];
    if (!validator.isLength(postInput.title, {min: 5})) {
        errors.push({
            message: 'Title must be at least 5 characters',
        });
    }

    if (!validator.isLength(postInput.content, {min: 5})) {
        errors.push({
            message: 'Content must be at least 5 characters',
        })
    }

    if (errors.length > 0) {
        const error = new Error('Invalid input');
        error.data = errors;
        error.status = 422
        throw error;
    }
}

exports.createPost = async function ({postInput}, req) {
    check.authCheck(req)
    validatePost(postInput);
    const user = await User.findById(req.userId);
    if (!user) {
        const error = new Error('Invalid user');
        error.status = 401;
        throw error;
    }
    const post = await new Post({
        title: postInput.title,
        imageUrl: postInput.imageUrl,
        content: postInput.content,
        creator: user
    }).save();

    user.posts.push(post);
    await user.save();

    return {
        ...post._doc,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    }
    // res.status(201).json({
    //     message: 'Post created successfully.',
    //     post: {...post._doc, creator: {_id: req.userId, name: user.name}},
    //     creator: {
    //         _id: user._id,
    //         name: user.name
    //     },
    // })
}

exports.posts = async function ({page, perPage}, req) {
    check.authCheck(req)
    page = page ?? 1;
    perPage = perPage ?? 2;
    validatePagination(page, perPage);
    const totalItems = await Post.estimatedDocumentCount();
    const totalPages = Math.ceil(totalItems / perPage);
    const posts = await Post.find()
        .sort({createdAt: -1})
        .skip((page - 1) * perPage)
        .limit(perPage)
        .populate('creator');
    return {
        posts: posts.map(post => ({
            ...post._doc,
            _id: post._id.toString(),
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        })),
        totalItems: totalItems,
        totalPages: totalPages,
        perPage: perPage,
        page: page
    };
}

function validatePagination(page, perPage) {
    const errors = [];
    if (page <= 0) {
        errors.push({
            message: 'page must be an integer greater than 0',
        });
    }

    if (perPage <= 0) {
        errors.push({
            message: 'perPage must be an integer greater than 0',
        });
    }

    if (errors.length > 0) {
        const error = new Error('Invalid input');
        error.data = errors;
        error.status = 422
        throw error;
    }
}

exports.post = async function ({id}, req) {
    check.authCheck(req)

    const post = await Post.findById(id).populate('creator');
    if (post) {
        return {
            ...post._doc
        };
    } else {
        const err = new Error('Not Found!');
        err.status = 404;
        throw err;
    }

}

function sameCreatorCheck(creator, userId) {
    if (creator !== userId) {
        const error = new Error('Not authorized');
        error.status = 403;
        throw error;
    }
}

exports.updatePost = async function ({id, postInput}, req) {
    check.authCheck(req)
    const post = await Post.findById(id).populate('creator');
    postFoundCheck(post);
    sameCreatorCheck(post.creator._id.toString(), req.userId.toString());
    validatePost(postInput);

    post.title = postInput.title;
    post.content = postInput.content;
    if (postInput.imageUrl !== 'undefined') {
        post.imageUrl = postInput.imageUrl;
    }

    const updatedPost = await post.save();

    // user.posts.push(post);
    // await user.save();

    return {
        ...updatedPost._doc,
        _id: updatedPost._id.toString(),
        createdAt: updatedPost.createdAt.toISOString(),
        updatedAt: updatedPost.updatedAt.toISOString(),
    }
}

function postFoundCheck(post) {
    if (!post) {
        const error = new Error('No post found!');
        error.status = 404;
        throw error;
    }
}

exports.deletePost = async function ({id}, req) {
    check.authCheck(req)
    const post = await Post.findById(id);
    postFoundCheck(post);
    sameCreatorCheck(post.creator.toString(), req.userId.toString());
    file.clearImage(post.imageUrl);
    await Post.findByIdAndDelete(id);
    const user = await User.findById(req.userId);
    user.posts.pull(id)
    await user.save();
    return true;
}

exports.user = async function (args, req) {
    check.authCheck(req)
    const user = await User.findById(req.userId);
    if (!user) {
        const error = new Error('No user found!');
        error.status = 404;
        throw error;
    }

    return {
        ...user._doc,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }
}

exports.updateStatus = async function ({status}, req) {
    check.authCheck(req)
    const user = await User.findById(req.userId);
    if (!user) {
        const error = new Error('No user found!');
        error.status = 404;
        throw error;
    }

    user.status = status;
    await user.save();

    return {
        ...user._doc,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }
}