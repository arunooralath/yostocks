const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,    
    symbol: { 
        type: String, 
        required: true, 
        unique: true,        
    },
    name:String,
    type:String,
    timeZone:String,
    currency:Number,     
    logo_url:String,
    tags:[String],
    date: { type: Date, default: Date.now },    
});

module.exports = mongoose.model('Product', productSchema);