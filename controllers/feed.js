const fs = require('fs');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = (req, res, next) => {
    const currentPage = +req.query.page ?? 1;
    const perPage = 2;
    let totalItems;
    let totalPages;
    Post.estimatedDocumentCount()
        .then((count) => {
            totalItems = count;// count /
            totalPages = Math.ceil(count / perPage);
            return Post.find().skip((currentPage - 1) * perPage)
                .limit(perPage);
        }).then((posts) => {
        res.status(200).json({
            posts: posts,
            totalItems: totalItems,
            totalPages: totalPages,
            perPage: perPage,
            currentPage: currentPage
        });
    })
        .catch(err => {
            if (!err.status) {
                err.status = 500;
            }
            next(err);
        });
};

exports.createPost = (req, res, next) => {
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = (req.file) ? req.file.path.replace("\\", "/") : req.body.image;

    if (!imageUrl) {
        const error = new Error('Not File Picked');
        error.status = 422;
        throw error;
    }

    const post = new Post({
        title: title,
        imageUrl: imageUrl,
        content: content,
        creator: req.userId
    });
    post.save().then(() => User.findById(req.userId)).then(user => {
        user.posts.push(post);
        return user.save();
    }).then(user => {
        res.status(201).json({
            message: 'Post created successfully.',
            post: post,
            creator: {
                _id: user._id,
                name: user.name
            },
        })
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    });
}

exports.getPost = (req, res, next) => {
    const postId = req.params.postId;
    Post.findById(postId).then((post) => {
        if (post) {
            res.status(200).json({
                post: post
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

function checkIfAuthorized(post) {
    if (post.creator.toString() !== req.userId) {
        const error = new Error('Could not find post.');
        error.status = 404
        throw error;
    }
}

exports.updatePost = (req, res, next) => {
    const postId = req.params.postId;
    const title = req.body.title;
    const content = req.body.content;
    let imageUrl = (req.file) ? req.file.path.replace("\\", "/") : req.body.image;

    if (!imageUrl) {
        const error = new Error('Not File Picked');
        error.status = 422;
        throw error;
    }

    Post.findById(postId).then((post) => {
        if (post) {
            checkIfAuthorized(post)
            if (post.imageUrl !== imageUrl) {
                clearImage(post.imageUrl);
            }
            post.title = title;
            post.imageUrl = imageUrl;
            post.content = content;
            return post.save();
        } else {
            const error = new Error('Not Found!');
            error.status = 404;
            throw error;
        }
    }).then(post => {
        res.status(200).json({
            post: post
        })
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    });
}

exports.deletePost = (req, res, next) => {
    const postId = req.params.postId;

    Post.findById(postId).then((post) => {
        if (post) {
            checkIfAuthorized(post)
            clearImage(post.imageUrl);
            return Post.findByIdAndDelete(postId)
        } else {
            const error = new Error('Not Found!');
            error.status = 404;
            throw error;
        }
    }).then(() => User.findById(req.userId)
    ).then(user => {
        user.posts.pull(postId)
        return user.save();
    }).then(() => {
        res.status(204).json({
            message: 'Post deleted successfully.',
        });
    }).catch(err => {
        if (!err.status) {
            err.status = 500;
        }
        next(err);
    });
}

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => console.log(err));
}