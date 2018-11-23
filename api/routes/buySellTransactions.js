const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const BuySellTransactions = require("../models/buySellTransactions");


// fetch all transactions by email + symbol
router.post("/alltransactions", async (req, res, next) => {
  var transactions = await BuySellTransactions.find({
    email: req.body.email,
    symbol: req.body.symbol
  });
  res.send(transactions);
});

module.exports = router;
