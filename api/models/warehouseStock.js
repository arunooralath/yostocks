const mongoose = require('mongoose');
const warehouseStockSchema = mongoose.Schema({

    _id: mongoose.Schema.Types.ObjectId,
    symbol: {
        type: String,
        required: true,
        unique: true,
    },
    units: {
        type: Number,
        required: true
    },
    baseValue: {
        type: Number,
        required: true
    },
    totalValue: {
        type: Number,
        required: true
    },
    baseCurrency: {
        type: String,
        required: true
    }

});
module.exports = mongoose.model('WarehouseStock', warehouseStockSchema);