const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BuySellTransactions = require("../models/buySellTransactions");
const axios = require("axios");
const _ = require("lodash");

// fetch all transactions by email + symbol
router.post("/alltransactions", async (req, res, next) => {
  var transactions = await BuySellTransactions.find({
    email: req.body.email,
    symbol: req.body.symbol
  });
  res.send(transactions);
});

router.post("/lossgain", async (req, res, next) => {
  let logs;
  console.log(req.body);
  //logs = await BuySellTransactions.find({ emailId: req.body.email });
  // if(logs){
  //   logs.forEach(function(value, i) {
  //     console.log("logs--",logs[i]);
  //     if(logs[i].type="buy"){

  //     }
  //   });
  // }

  const key = "F41ON15LGCFM4PR7";
  const url =
    "https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=AAPL,NFLX&apikey=3WJVTZ3CHLY55LZB";
  try {
    const response = await axios.get(url);
    let qoute = _.flattenDeep(
      Array.from(response.data["Stock Quotes"]).map(stock => [
        {
          symbol: stock["1. symbol"],
          price: stock["2. price"],
          volume: stock["3. volume"],
          timestamp: stock["4. timestamp"]
        }
      ])
    );
    qoute.forEach(function(value, i) {
      console.log(qoute[i].symbol);
    });
    res.send(qoute);
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }
});

module.exports = router;
