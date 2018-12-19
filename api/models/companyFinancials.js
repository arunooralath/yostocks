const mongoose = require('mongoose');

const companyFinancialsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    symbol: { 
        type: String, 
        required: true, 
        unique: true,        
    },
    year:String,
    revenue:String,
    operatingIncome:String,
    netIncome:String,
    totalAssets:String,
    returnOnEquity:String,
    returnOnAssets:String,
    peRatio:String,    
    currency:String   

});

module.exports = mongoose.model('CompanyFinancials', companyFinancialsSchema);
