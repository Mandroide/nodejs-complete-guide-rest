const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {
    const currentPage = +req.query.page ?? 1;
    const perPage = 2;
    try {
        const totalItems = await Post.estimatedDocumentCount();
        const totalPages = Math.ceil(totalItems / perPage);
        const posts = await Post.find()
            // .populate('creator')
            .skip((currentPage - 1) * perPage)
            .limit(perPage);
        res.status(200).json({
            posts: posts,
            totalItems: totalItems,
            totalPages: totalPages,
            perPage: perPage,
            currentPage: currentPage
        });
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }

};

exports.createPost = async (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = (req.file) ? req.file.path.replace("\\", "/") : req.body.image;
    if (!imageUrl) {
        const error = new Error('Not File Picked');
        error.status = 422;
        throw error;
    }
    try {
        const post = await new Post({
            title: title,
            imageUrl: imageUrl,
            content: content,
            creator: req.userId
        }).save();

        const user = await User.findById(req.userId);
        user.posts.push(post);
        await user.save();
        res.status(201).json({
            message: 'Post created successfully.',
            post: post,
            creator: {
                _id: user._id,
                name: user.name
            },
        })
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }
}

exports.getPost = async (req, res, next) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (post) {
            res.status(200).json({
                post: post
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

function checkIfAuthorized(post, req) {
    if (post.creator.toString() !== req.userId) {
        const error = new Error('Could not find post.');
        error.status = 404
        throw error;
    }
}

exports.updatePost = async (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = (req.file) ? req.file.path.replace("\\", "/") : req.body.image;

    if (!imageUrl) {
        const error = new Error('Not File Picked');
        error.status = 422;
        throw error;
    }

    try {
        const post = await Post.findById(postId);
        if (post) {
            checkIfAuthorized(post, req)
            if (post.imageUrl !== imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            await post.save();
            res.status(200).json({
                post: post
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
}

exports.deletePost = async (req, res, next) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
        if (post) {
            checkIfAuthorized(post, req)
            clearImage(post.imageUrl);
            await Post.findByIdAndDelete(postId)
        } else {
            const err = new Error('Not Found!');
            err.status = 404;
            next(err);
            const user = await User.findById(req.userId);
            user.posts.pull(postId)
            await user.save();
            res.status(204).json({
                message: 'Post deleted successfully.',
            });
        }
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    }
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}