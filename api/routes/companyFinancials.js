const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const CompanyFinancials = require("../models/companyFinancials");

router.get("/:symbol", async (req, res, next) => {
  console.log("addFinancials");
  try {
    let cf = await CompanyFinancials.findOne({ symbol: req.params.symbol });
    console.log(cf);
    if (cf) {
      res.send(cf);
    } else {
      res.status(400).json({
        message: "No Such Profile"
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err
    });
  }
});

// admin services

router.post("/addFinancials", async (req, res, next) => {
  console.log("addFinancials");
  try {
    let cf = await CompanyFinancials.findOne({ symbol: req.body.symbol });
    console.log(cf);
    if (cf) {
      res.status(400).json({
        message: "Profile Already Exists"
      });
    } else {
      const cfObj = new CompanyFinancials({
        _id: new mongoose.Types.ObjectId(),
        symbol: req.body.symbol,
        year: req.body.year,
        revenue: req.body.revenue,
        operatingIncome: req.body.operatingIncome,
        netIncome: req.body.netIncome,
        totalAssets: req.body.totalAssets,
        returnOnEquity: req.body.returnOnEquity,
        returnOnAssets: req.body.returnOnAssets,
        peRatio: req.body.peRatio
      });
      let result = cfObj.save();
      res.send("Profile Created");
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err
    });
  }
});

module.exports = router;
