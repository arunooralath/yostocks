const mongoose = require("mongoose");

const buySellTransactionsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  type: {
    type: String,
    required: true
  },
  emailId: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  units: {
    type: Number,
    required: true
  },
  basePrice: {
    type: Number,
    required: true
  },
  baseCurrencyAmount: {
    type: Number,
    required: true
  },
  localCurrencyAmount: {
    type: Number,
    required: true
  },
  baseCurrency: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model(
  "BuySellTransactions",
  buySellTransactionsSchema
);
