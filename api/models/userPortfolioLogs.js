const mongoose = require('mongoose');

const userPortfolioLogsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: string,
    symbol: string,
    stockUnits: number,
    stockValue: number,
    amount:number,
    transactionType:String,
    date:Date,
    baseCurrency: string,
    transactionCurrency:string
})

module.exports = mongoose.model('UserPortfolioLogs',userPortfolioLogsSchema)