const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");


router.post("/buy", (req, res, next) => {

});

router.post("/sell", (req, res, next) => {

    var baseValue, units, totalValue,baseCurrency;
    var userbaseValue, userUnits, userAmount;

    // check if baseprice from client side is same as serverside
    // if same make the sell transaction. else update the server and make the sell transaction
    // transfer the amount to the user wallet in base currency

    WarehouseStock.findOne({ name: req.body.symbol })
        .exec()
        .then(doc => {
            if (doc) {

                userbaseValue = req.body.baseValue; //basevalue on client side
                baseValue = doc.baseValue; //basevalue on server
                units = doc.units //Units of product available on server
                totalValue = doc.totalValue //total value of stock on server.
                baseCurrency = doc.baseCurrency; //basecurrency of the warehouseStock
                // if(userbaseValue == baseValue){
                //     // make the sell

                // }

                userUnits = (userAmount / baseValue);
                units = units + userUnits; //add the number of units to warehouseStock
                totalValue = baseValue * units;
                WarehouseStock.updateOne({ symbol: req.body.symbol }, {
                    $set: { units: units, totalValue: totalValue }
                }).exec().then(result => {
                    // update the transaction and user wallet

                    User.updateOne
                    


                })


            }
            else {
                res.status(404)
                    .json({ message: "No valid entry found for provided product symbol" });
            }
        });

});









module.exports = router;