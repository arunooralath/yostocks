const mongoose = require("mongoose");

const buyTransactionsSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
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

module.exports = mongoose.model("BuyTransactions", buyTransactionsSchema);
