const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./api/routes/user');
const productRoutes = require("./api/routes/products");
// var dotenv = require('dotenv');
// dotenv.load();

mongoose.connect(
    "mongodb://root:" +
    "password1" +
    "@ds125423.mlab.com:25423/yostocks",
    {
        useNewUrlParser: true
    }
);

mongoose.Promise = global.Promise;

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// Routes which should handle requests
 app.use("/products", productRoutes);
// app.use("/orders", orderRoutes);
app.use("/user", userRoutes);


app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});

app.use((req, res, next) => {
    res.status(200).json({
        message: 'It works!....:)'
    });
});

module.exports = app;