const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
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
// fetch product with name
router.get("/:name", (req, res, next) => {
    console.log("fetch product with name");
    const id = req.params.name;
    Product.find({ symbol: id })
        .exec()
        .then(doc => {
            console.log("From database", doc);
            if (doc) {
                res.status(200).json(doc);
            } else {
                res
                    .status(404)
                    .json({ message: "No valid entry found for provided name" });
            }
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({ error: err });
        });
});

// insert product to Products collection
router.post("/addnew", (req, res, next) => {
    Product.find({ name: req.body.name })
        .exec()
        .then(doc => {
            if (doc.length >= 1) {
                return res.status(409).json({
                    message: "Product already regestered"
                });
            } else {
                const product = new Product({
                    _id: new mongoose.Types.ObjectId(),
                    symbol: req.body.symbol,
                    name: req.body.name,
                    logo_url: req.body.logo_url,
                    tags: req.body.tags,
                    currency:req.body.currency
                });
                product
                    .save()
                    .then(result => {
                        console.log(result);
                        res.status(201).json({
                            message: "Handling POST requests to /products",
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


module.exports = router;


