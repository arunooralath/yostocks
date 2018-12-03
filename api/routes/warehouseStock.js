const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const Product = require("../models/product");
const axios = require("axios");

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
    .exec()
    .then(doc => {
      if (doc.length >= 1) {
        // if stock exists then update stock
        tValue = doc[0].totalValue + req.body.units * req.body.baseValue;
        sunits = parseInt(doc[0].units) + parseInt(req.body.units);

        // console.log(doc[0].symbol);
        WarehouseStock.updateOne(
          { symbol: req.body.symbol },
          { $set: { units: sunits, totalValue: tValue } }
        )
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
        tValue = req.body.units * req.body.baseValue;
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

router.post("/update", async (req, res, next) => {
  let stock, units, totalValue, stockUnits, stockTotalValue;
  console.log(req.body);
  try {
    stock = await WarehouseStock.findOne({ symbol: req.body.symbol });
    const qoute = await axios.get(
      "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
        req.body.symbol +
        "&apikey=3WJVTZ3CHLY55LZB"
    );
    if (stock) {
      console.log("stock found");
      stockUnits = parseFloat(stock.units);
      baseValue = parseFloat(stock.baseValue);
      //   stockTotalValue = parseFloat(stock.totalValue);
      let basePrice = parseFloat(qoute.data["Global Quote"]["05. price"]);
      units = parseFloat(req.body.units);
      units += stockUnits;
      totalValue = basePrice * units;

      try {
        let response = await WarehouseStock.updateOne(
          { symbol: req.body.symbol },
          {
            $set: {
              units: units,
              totalValue: totalValue,
              baseValue: basePrice,
              preBaseValue:baseValue
            }
          }
        );
        res.send(response);
      } catch (err) {
        res.status(500).json({
          error: err
        });
      }
    } else {
      console.log("No stock found");
      res.status(400).json({
        error: "No such product"
      });
    }
  } catch (err) {
    // res.status(500).json({
    //   error: err
    // });
    console.log(err);
  }
});

module.exports = router;
