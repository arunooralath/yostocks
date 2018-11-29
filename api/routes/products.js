const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const Product = require("../models/product");
const axios = require("axios");
const _ = require("lodash");

// fetch all products
router.get("/", async (req, res, next) => {
  try {
    let product = await Product.find();
    res.send(product);
  } catch (err) {
    res.status(500).json({
      err: err
    });
  }
});

// fetch products with price
router.get("/list/:currency", async (req, res, next) => {
  const currency = req.params.currency;
  let arr = [];
  let arr2 = [];
  let prodResponse = [];
  try {
    let product = await Product.find();

    product.forEach(element => {
      arr.push(element.symbol);
    });
    console.log(arr.toString());

    for (i = 0; i < product.length; i++) {
      // console.log(product[i].symbol,qoute[i].symbol)
      const response = await axios.get(
        "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
          product[i].symbol +
          "&apikey=3WJVTZ3CHLY55LZB"
      );
      // console.log(response.data);

      let basePrice = parseFloat(response.data["Global Quote"]["05. price"]);
      let change = response.data["Global Quote"]["09. change"];

      const forex = await axios.get(
        "https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=" +
          product[i].currency +
          "&to_currency=" +
          currency +
          "&apikey=3WJVTZ3CHLY55LZB"
      );

      let exgRate = parseFloat(
        forex.data["Realtime Currency Exchange Rate"]["5. Exchange Rate"]
      );
      let stat;
      let localcurrencyprice = basePrice * exgRate;
      change = change * exgRate;
      if (change < 0) stat = "loss";
      else stat = "gain";

      const prod = {
        _id: product[i]._id,
        symbol: product[i].symbol,
        brandname: product[i].brandname,
        logo_url: product[i].logo_url,
        currency: product[i].currency,
        tags: [product[i].tags],
        date: product[i].date,
        localprice: localcurrencyprice,
        change: change,
        status: stat
      };
      prodResponse.push(prod);
    }

    res.status(200).json(prodResponse);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      err: err
    });
  }
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
