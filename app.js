const express = require('express');
const app = express();
const cors = require('cors');
const feedRouter = require('./routes/feed');

const corsOptions = {
    "origin": "*",
    "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/feed', feedRouter);

app.listen(8080);