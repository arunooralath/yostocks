const mongoose = require("mongoose");

const sellTransactionsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
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

module.exports = mongoose.model("SellTransactions", sellTransactionsSchema);
