const mongoose = require("mongoose");

const userInterestSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  email: {
    type: String,
    required: true
  },
  symbol: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserInterest", userInterestSchema);
