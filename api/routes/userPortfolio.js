const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserPortfolio = require("../models/userPortfolio");
const BuySellTransactions = require("../models/buySellTransactions");


// fetch all UserPortfolio by email
router.get("/:email", async(req, res, next) => {
    var userPortfolio = await UserPortfolio.find({email:req.params.email})
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

// buy stocks to portfolio
router.post("/buy", (req, res, next) => {});

// sell stocks from portfolio
router.post("/sell", (req, res, next) => {});

module.exports = router;