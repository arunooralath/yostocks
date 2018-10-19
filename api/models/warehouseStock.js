const mongoose = require('mongoose');
const warehouseStockSchema = mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId,
    symbol: { 
        type: String, 
        required: true, 
        unique: true,        
    },

});