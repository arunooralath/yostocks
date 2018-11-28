const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const Product = require("../models/product");

// fetch all products
router.get("/", (req, res, next) => {
  Product.find()
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
// fetch product with brandname
router.get("/:brandname", (req, res, next) => {
  console.log("fetch product with brandname");
  const id = req.params.brandname;
  Product.find({ symbol: id })
    .exec()
    .then(doc => {
      console.log("From database", doc);
      if (doc) {
        res.status(200).json(doc);
      } else {
        res.status(404).json({
          message: "No valid entry found for provided brandname"
        });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ error: err });
    });
});

// insert product to Products collection
router.post("/add", async (req, res, next) => {
  console.log(req.body);
  let product;
  try {
    product = await Product.findOne({ symbol: req.body.symbol });
    if (product) {
      res.status(400).json({
        error: "product exits"
      });
    } else {
      const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        symbol: req.body.symbol,
        brandname: req.body.brandname,
        logo_url: req.body.logo_url,
        tags: req.body.tags,
        currency: req.body.currency
      });
      const warehouseStock = new WarehouseStock({
        _id: new mongoose.Types.ObjectId(),
        symbol: req.body.symbol,
        brandname: req.body.brandname,
        units: "0",
        baseValue: "0",
        totalValue: "0",
        baseCurrency: req.body.currency
      });
      try {
        let productRes = await product.save();
        let stockRes = await warehouseStock.save();
        res.send(productRes);
      } catch (err) {
        res.status(500).json({
          error: err
        });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: err
    });
  }
});

module.exports = router;
