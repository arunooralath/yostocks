const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const UserInterest = require("../models/userInterest");

router.post("/add", async (req, res, next) => {
  const userInterest = new UserInterest({
    _id: new mongoose.Types.ObjectId(),
    symbol: req.body.symbol,
    email: req.body.email
  });
  try {
    let response = await userInterest.save();
    res.status(201).json({
      message: "Updated"
    });
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }
});

module.exports = router;
