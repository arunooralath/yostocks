const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserPortfolio = require("../models/userPortfolio");
const BuySellTransactions = require("../models/buySellTransactions");
const WareHouseStock = require("../models/warehouseStock");
const User = require("../models/user");
const axios = require("axios");
const Product = require("../models/product");

// fetch all UserPortfolio by email
router.get("/:email", async (req, res, next) => {
  let userPortfolio = await UserPortfolio.find({ email: req.params.email });
  // console.log(userPortfolio);
  let portfolioResponse = [];

  for (i = 0; i < userPortfolio.length; i++) {
    console.log(userPortfolio[i]);
    const product = await Product.findOne({ symbol: userPortfolio[i].symbol });
    const prod = {
      id: userPortfolio[i].id,
      email: userPortfolio[i].email,
      symbol: userPortfolio[i].symbol,
      brandname: userPortfolio[i].brandname,
      stockUnits: userPortfolio[i].stockUnits,
      baseValueEntry: userPortfolio[i].baseValueEntry,
      baseValueLast: userPortfolio[i].baseValueLast,
      baseCurrency: userPortfolio[i].baseCurrency,
      logo_url:product.logo_url
    };
    portfolioResponse.push(prod);
  }

  res.send(portfolioResponse);
});

// fetch all UserPortfolio by email
router.get("/transactions/:email", (req, res, next) => {});

// fetch all transactions by email + symbol
router.post("/alltransactions", async (req, res, next) => {
  console.log(req.body);
  var transactions = await BuySellTransactions.find({
    emailId: req.body.email,
    symbol: req.body.symbol
  });
  res.send(transactions);
});

// get portfolio status
router.post("/status", async (req, res, next) => {
  let userEmail = req.body.email;
  let userCurrency = req.body.localcurrency;
  let buyAmount = 0;
  let currentAmount = 0;
  let stock;
  try {
    let logs = await BuySellTransactions.find({ emailId: userEmail });
    stock = await WareHouseStock.find();

    if (logs) {
      console.log(logs);

      for (i = 0; i < logs.length; i++) {
        // get the buy amount and units
        let BA = parseFloat(logs[i].baseCurrencyAmount);
        let bUints = parseFloat(logs[i].units);
        // console.log("buyAmount", BA);

        // fetch the price from Stock DB
        // const response = await axios.get(
        //   "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
        //     logs[i].symbol +
        //     "&apikey=3WJVTZ3CHLY55LZB"
        // );

        // fetch the price from Stock DB
        const stockSymbol = findElement(stock, "symbol", logs[i].symbol);
        // console.log("Stock from Warehouse", stockSymbol["baseValue"]);

        let basePrice = parseFloat(stockSymbol["baseValue"]);
        let cng = basePrice * bUints;
        // console.log(cng);

        //   fetch exchange rate
        const forex = await axios.get(
          "https://api.exchangeratesapi.io/latest?base=" +
            logs[i].baseCurrency +
            "&symbols=" +
            userCurrency
        );

        // console.log(forex.data);
        // get exchange rate
        let exgRate = parseFloat(forex.data["rates"][userCurrency]);

        // BA = BA * exgRate;
        cng = cng * exgRate;
        // console.log(BA, cng);

        console.log("------type-----", logs[i].type);
        if (logs[i].type == "buy") {
          buyAmount += BA;
          currentAmount += cng;
          // console.log("buy", buyAmount, currentAmount);
        } else if (logs[i].type == "sell") {
          buyAmount -= BA;
          currentAmount -= cng;
          // console.log("sell", buyAmount, currentAmount);
        }
      }
      let change = currentAmount - buyAmount;
      let user = await User.findOne({ email: userEmail });
      if (user) {
        const forex = await axios.get(
          "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=" +
            userCurrency +
            "&apikey=3WJVTZ3CHLY55LZB"
        );
        // console.log(forex.data);
        // get exchange rate
        let exgRate = parseFloat(
          forex.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
        );
        let wallet = parseFloat(user.wallet) * exgRate;

        res.status(200).json({
          total: currentAmount,
          change: change,
          balance: wallet
        });
      } else {
        res.status(401).json({
          message: "Unauthorized"
        });
      }
    } else {
      res.status(400).json({
        message: "Portfolio Empty"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      err: err
    });
  }
});

router.post("/details", async (req, res, next) => {
  let logs, portfolio;
  let userCurrency = req.body.localcurrency;
  console.log("portfolio details -body ", req.body);
  try {
    logs = await BuySellTransactions.find({
      emailId: req.body.email,
      symbol: req.body.symbol
    });
    portfolio = await UserPortfolio.findOne({
      email: req.body.email,
      symbol: req.body.symbol
    });
  } catch (err) {
    res.status(500).json({
      err: err
    });
  }
  console.log(portfolio, logs);
  let pBaseValue = portfolio.baseValueLast;
  let pUnits = parseFloat(portfolio.stockUnits);
  pUnits = Number(Number(pUnits).toFixed(10));

  let purchasedUnits = 0;
  let soldUnits = 0;
  let purchaseAmount = 0;
  let soldAmount = 0;

  for (i = 0; i < logs.length; i++) {
    if (logs[i].type == "buy") {
      purchasedUnits += parseFloat(logs[i].units);
      purchaseAmount += parseFloat(logs[i].baseCurrencyAmount);
    } else if (logs[i].type == "sell") {
      soldUnits += parseFloat(logs[i].units);
      soldAmount += parseFloat(logs[i].baseCurrencyAmount);
    }
  }

  let logUnits = purchasedUnits - soldUnits;
  logUnits = Number(Number(logUnits).toFixed(10));

  console.log(pUnits, logUnits);
  let equity = 0;
  let boughtAt = 0;

  if (logUnits > 0 && logUnits == pUnits) {
    //   fetch exchange rate
    const forex = await axios.get(
      "https://api.exchangeratesapi.io/latest?base=" +
        portfolio.baseCurrency +
        "&symbols=" +
        userCurrency
    );

    console.log(forex.data);
    // get exchange rate
    let exgRate = parseFloat(forex.data["rates"][userCurrency]);

    equity = parseFloat(portfolio.baseValueLast) * exgRate;
    equity = Number(Number(equity).toFixed(4));
    boughtAt = (purchaseAmount - soldAmount) / pUnits;
    boughtAt = boughtAt * exgRate;
    boughtAt = Number(Number(boughtAt).toFixed(4));
    let stat = equity - boughtAt;
    res.status(200).json({
      yourShares: logUnits,
      equity: equity,
      boughtAt: boughtAt,
      status: stat
    });
  } else {
    res.status(500).json({
      err: "noStock"
    });
  }
});

function findElement(arr, propName, propValue) {
  for (var i = 0; i < arr.length; i++)
    if (arr[i][propName] == propValue) return arr[i];

  // will return undefined if not found; you could return a default instead
}

module.exports = router;
