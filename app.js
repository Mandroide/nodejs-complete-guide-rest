const express = require('express');
const cors = require('cors');
const {v4: uuidv4} = require('uuid');
const mongoose = require("mongoose");
const multer = require("multer");
const {graphqlHTTP} = require('express-graphql');
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const env = require("dotenv")
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

    app.use('/graphql', graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver
    }))

    app.use((err, req, res, next) => {
        console.log(err);
        const status = err.status ?? 500;
        const message = err.message;
        res.status(status).json({message: message});
    });
    app.listen(8080);
}).catch(err => {
    console.log(err);
})