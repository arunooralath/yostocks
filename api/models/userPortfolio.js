const mongoose = require("mongoose");

const userPortfolioSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: String,
  symbol: String,
  brandname: {
    type: String,
    required: true
  },
  stockUnits: Number,
  baseValueEntry: Number,
  baseValueLast: Number,
  baseCurrency: String
});
module.exports = mongoose.model("UserPortfolio", userPortfolioSchema);
