const express = require('express');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');
const mongoose = require("mongoose");
const multer = require("multer");
const {graphqlHTTP} = require('express-graphql');
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const authMiddleware = require("./middleware/auth");
const env = require("dotenv")
const file = require("./util/file");
const check = require("./util/check");
env.config();

mongoose.connect(process.env.DB_URI, {
    w: 'majority',
    appName: process.env.DB_APP_NAME,
    retryWrites: true,
    authSource: process.env.DB_AUTH_SOURCE,
    dbName: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASSWORD
}).then(() => {
    const app = express();
    const corsOptions = {
        "origin": "*",
        "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
        allowedHeaders: ['Content-Type', 'Authorization']
    };
    app.use(cors(corsOptions));
    app.use(express.json());
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, 'images');
        },
        filename: function (req, file, cb) {
            const ext = (file) ? '.' + file.originalname.split('.').pop() : '';
            cb(null, `${uuidv4()}${ext}`);
        }
    });

    const fileFilter = (req, file, cb) => {
        cb(null, (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)))
    }

    app.use(multer({storage: storage, fileFilter: fileFilter}).single("image"));

    app.use('/images', express.static('images'));

    app.use(authMiddleware.rejectIfInvalidToken)

    app.put('/post-image', (req, res, next) => {
        check.authCheck(req)

        if (!req.file) {
            return res.status(200).json({
                message: 'Image not found'
            });
        }
        if (req.body.oldPath) {
            file.clearImage(req.body.oldPath);
        }

        return res.status(201).json({
            message: 'Image stored',
            filePath: req.file.path
        })
    });

    app.use((req, res, next) => {
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        next();
    });

    app.use('/graphql', graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err) {
            if (!err.originalError) {
                return err;
            } else {
                const data = err.originalError.data
                const message = err.message ?? 'An error occurred.';
                const status = err.originalError.status ?? 500;
                return {message: message, status: status, data: data};
            }
        }
    }));

    app.use((err, req, res, next) => {
        console.log(err);
        const status = err.status ?? 500;
        const message = err.message;
        res.status(status).json({message: message});
    });
    app.listen(process.env.PORT);
}).catch(err => {
    console.log(err);
})