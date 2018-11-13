const mongoose = require('mongoose');

const userPortfolioSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: string,
    symbol: string,
    stockUnits: number,
    baseValueEntry: number,
    baseValueLast:number,
    baseCurrency: string

});

module.exports = mongoose.model('UserPortfolio', userPortfolioSchema);
