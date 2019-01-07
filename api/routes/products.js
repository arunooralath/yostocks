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
    let product = await WarehouseStock.find();
    // console.log(product);

    product.forEach(element => {
      arr.push(element.symbol);
    });
    console.log(arr.toString());

    for (i = 0; i < product.length; i++) {
      // const response = await axios.get(
      //   "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=" +
      //     product[i].symbol +
      //     "&apikey=3WJVTZ3CHLY55LZB"
      // );

      // let basePrice = parseFloat(response.data["Global Quote"]["05. price"]);
      // let change = response.data["Global Quote"]["09. change"];

      let basePrice = parseFloat(product[i].baseValue);
      let change = basePrice - parseFloat(product[i].preBaseValue);

      // find product from product Table
      const prdt = await Product.findOne({ symbol: product[i].symbol });
      console.log(prdt.logo_url);

      const forex = await axios.get(
        "https://api.exchangeratesapi.io/latest?base=" +
          product[i].baseCurrency +
          "&symbols=" +
          currency
      );

      let exgRate = parseFloat(forex.data["rates"][currency]);
      let stat;
      let localcurrencyprice = basePrice * exgRate;
      change = change * exgRate;

      if (change < 0) stat = "loss";
      else stat = "gain";

      const prod = {
        _id: product[i]._id,
        symbol: product[i].symbol,
        brandname: product[i].brandname,
        logo_url: prdt.logo_url,
        currency: product[i].baseCurrency,
        tags: [prdt.tags],
        date: prdt.date,
        localprice: localcurrencyprice,
        change: change,
        status: stat
      };
      // console.log(prod);
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
        preBaseValue: "0",
        totalValue: "0",
        baseCurrency: req.body.currency
      });
      try {
        let productRes = await product.save();
        let stockRes = await warehouseStock.save();
        res.send(productRes);
      } catch (err) {
        console.log(err);
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
