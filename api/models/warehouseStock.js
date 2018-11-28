const mongoose = require('mongoose');
const warehouseStockSchema = mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId,
    symbol: {
        type: String,
        required: true,
        unique: true,
    },
    brandname: {
        type: String,
        required: true        
    },
    units: {
        type: Number,
        required: true,
        default:"0"
    },
    baseValue: {
        type: Number,
        required: true,
        default:"0"
    },
    totalValue: {
        type: Number,
        required: true,
        default:""
    },
    baseCurrency: {
        type: String,
        required: true,
        default:"USD"
    }

});
module.exports = mongoose.model('WarehouseStock', warehouseStockSchema);