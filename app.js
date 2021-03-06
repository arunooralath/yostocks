const express = require("express");
const app = express();
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const historyJob = require("./api/utils/historyJob");
const cronJob = require("./api/utils/cronJob")

// user routes
const userRoutes = require("./api/routes/user");
const productRoutes = require("./api/routes/products");
const warehouseStockRoutes = require("./api/routes/warehouseStock");
const tradeRoutes = require("./api/routes/buysell");
const userPortfolio = require("./api/routes/userPortfolio");
const userLogs = require("./api/routes/buySellTransactions");
const userInterest = require("./api/routes/userInterest");
const stockData = require("./api/routes/stockData");
const companyFinancials = require("./api/routes/companyFinancials");


// var dotenv = require('dotenv');
// dotenv.load();

mongoose.connect(
  "mongodb://root:" + "password1" + "@ds125423.mlab.com:25423/yostocks",
  {
    useNewUrlParser: true
  }
);

mongoose.Promise = global.Promise;

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Routes which should handle requests
app.use("/products", productRoutes);
// app.use("/orders", orderRoutes);
app.use("/user", userRoutes);
app.use("/warehouse", warehouseStockRoutes);
app.use("/trade", tradeRoutes);
app.use("/portfolio", userPortfolio);
app.use("/logs", userLogs);
app.use("/interest", userInterest);
app.use("/stockData", stockData);
app.use("/financials",companyFinancials);

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
    message: "It works!....:)"
  });
});

// cronJob.start();

// start cronJob for updating Stock Closing Rates at LA time
//historyJob.start();

module.exports = app;
