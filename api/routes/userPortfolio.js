const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserPortfolio = require("../models/userPortfolio");
const BuySellTransactions = require("../models/buySellTransactions");
const User = require("../models/user");
const axios = require("axios");

// fetch all UserPortfolio by email
router.get("/:email", async (req, res, next) => {
  var userPortfolio = await UserPortfolio.find({ email: req.params.email });
  console.log(userPortfolio);
  res.send(userPortfolio);
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

  try {
    logs = await BuySellTransactions.find({ emailId: userEmail });

    if (logs) {
      console.log(logs);

      for (i = 0; i < logs.length; i++) {
        // get the buy amount and units
        let BA = parseFloat(logs[i].baseCurrencyAmount);
        let bUints = parseFloat(logs[i].units);
        console.log("buyAmount", BA);

        // fetch the realtime price
        const response = await axios.get(
          "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
            logs[i].symbol +
            "&apikey=3WJVTZ3CHLY55LZB"
        );

        let basePrice = parseFloat(response.data["Global Quote"]["05. price"]);
        let cng = basePrice * bUints;
        console.log(cng);

        //   fetch exchange rate
        const forex = await axios.get(
          "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" +
            logs[i].baseCurrency +
            "&to_currency=" +
            userCurrency +
            "&apikey=3WJVTZ3CHLY55LZB"
        );
        console.log(forex.data);
        // get exchange rate
        let exgRate = parseFloat(
          forex.data['Realtime Currency Exchange Rate']['5. Exchange Rate']
        );

        // BA = BA * exgRate;
        cng = cng * exgRate;
        console.log(BA, cng);

        console.log("------type-----", logs[i].type);
        if (logs[i].type == "buy") {
          buyAmount += BA;
          currentAmount += cng;
          console.log("buy", buyAmount, currentAmount);
        } else if (logs[i].type == "sell") {
          buyAmount -= BA;
          currentAmount -= cng;
          console.log("sell", buyAmount, currentAmount);
        }
      }
      let change = currentAmount - buyAmount;
      let user = await User.findOne({ email: userEmail });
      if(user){
          
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
          let wallet = parseFloat(user.wallet)* exgRate;

        res.status(200).json({
            total: currentAmount,
            change: change,
            balance:wallet
          });
      }
      else{
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

module.exports = router;
