const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,    
    name: { 
        type: String, 
        required: true, 
        unique: true,        
    },
    brand: String,    
    logo_url:String,
    tags:[String],
    date: { type: Date, default: Date.now },    
});

module.exports = mongoose.model('Product', productSchema);