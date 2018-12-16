const mongoose = require("mongoose");

const productHistorySchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  date: { type: String, required: true },
  currency: { type: String, required: true },
  EUR: { type: String, required: true },
  DKK: { type: String, required: true },
  SEK: { type: String, required: true },
  NOK: { type: String, required: true },
  ISK: { type: String, required: true },
  HUF: { type: String, required: true },
  PLN: { type: String, required: true }
});

module.exports = mongoose.model("ProductHistory", productHistorySchema);
