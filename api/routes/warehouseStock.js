const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const Product = require("../models/product");



// fetch all products
router.get("/", (req, res, next) => {
    WarehouseStock.find()
        .exec()
        .then(docs => {
            console.log(docs);
            //   if (docs.length >= 0) {
            res.status(200).json(docs);
            //   } else {
            //       res.status(404).json({
            //           message: 'No entries found'
            //       });
            //   }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});
// get warehouseStock by symbol
router.get("/:symbol", (req, res, next) => {
    const symbol = req.params.symbol;
    WarehouseStock.find({ symbol: symbol })
        .exec()
        .then(docs => {
            console.log(docs);
            res.status(200).json(docs);
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });

});
router.post("/addnew", (req, res, next) => {
    var tValue;
    var sunits;
    console.log("add new warehouseStock");
    WarehouseStock.find({ symbol: req.body.symbol })
        .exec().then(doc => {
            if (doc.length >= 1) {
                // if stock exists then update stock
                tValue = (doc[0].totalValue) + (req.body.units * req.body.baseValue);
                sunits = parseInt(doc[0].units) + parseInt(req.body.units);

                // console.log(doc[0].symbol);                               
                WarehouseStock.updateOne({ symbol: req.body.symbol }, { $set: { units: sunits, totalValue: tValue } })
                    .exec()
                    .then(result => {
                        console.log(result);
                        res.status(200).json({
                            message: "Wpdated warehouse Stock",
                            symbol: req.body.symbol
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    });

            } else {
                // or else create stock
                tValue = (req.body.units * req.body.baseValue);
                const warehouseStock = new WarehouseStock({
                    _id: new mongoose.Types.ObjectId(),
                    symbol: req.body.symbol,
                    units: req.body.units,
                    baseValue: req.body.baseValue,
                    totalValue: tValue,
                    baseCurrency: req.body.baseCurrency
                });
                warehouseStock
                    .save()
                    .then(result => {
                        console.log(result);
                        res.status(201).json({
                            message: "Create warehouse Stock",
                            createdProduct: result
                        });
                    })
                    .catch(err => {
                        console.log(err);
                        res.status(500).json({
                            error: err
                        });
                    });
            }
        });

});
router.post("/update", (req, res, next) => {
    var uBasevalue, uTotalAmount, uUnits, eAmount, eUnits;
    Product.findOne({ name: req.body.symbol })
        .exec().then(doc => {
            if (doc) {
                WarehouseStock.findOne({ symbol: req.body.symbol })
                    .exec().then(result => {
                        if (result) {
                            console.log(result);
                            uBasevalue = req.body.baseValue; //updated basevalue
                            uUnits = req.body.units; // updated units
                            eUnits = result.units; //existing units                            
                            eAmount = (uBasevalue * eUnits); // existingAmount = existingUnits * updatedBasevalue
                            uTotalAmount = (uUnits * uBasevalue) + eAmount;
                            uUnits = parseFloat(uUnits) + parseFloat(eUnits);
                            console.log(uTotalAmount, uUnits);
                            WarehouseStock.updateOne({ symbol: req.body.symbol }, {
                                $set: { units: uUnits, totalValue: uTotalAmount, baseValue: uBasevalue }
                            })
                                .exec()
                                .then(result => {
                                    console.log(result);
                                    res.status(200).json({
                                        message: "Wpdated warehouse Stock",
                                        symbol: req.body.symbol
                                    });
                                })
                                .catch(err => {
                                    console.log(err);
                                    res.status(500).json({
                                        error: err
                                    });
                                });
                        } else {
                            res.status(500).json({
                                message: "No stock matching symbol",

                            });
                        }
                    }).catch();
            } else {
                res.status(500).json({
                    message: "No product matching symbol",

                });
            }
        }).catch();
});

module.exports = router;