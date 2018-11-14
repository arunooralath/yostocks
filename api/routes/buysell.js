const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const UserPortfolio = require("../models/userPortfolio");
const User = require("../models/user");

router.post("/buy", (req, res, next) => {
    

});

router.post("/sell", (req, res, next) => {

    var baseValue, units, totalValue, baseCurrency;
    var userbaseValue, userUnits, userAmount, userEmail, userPrice;

    /* check if baseprice from client side is same as serverside
     if same make the sell transaction. else update the server and make the sell transaction
     transfer the amount to the user wallet in base currency */

    // 1.verify warehouse stock
    WarehouseStock.findOne({ name: req.body.symbol })
        .exec()
        .then(doc => {
            if (doc) {
                userEmail = req.body.email;
                userbaseValue = req.body.baseValue; //basevalue on client side
                userAmount = req.body.amount //amount entered by user
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
                // 2. update WarehouseStock
                WarehouseStock.updateOne({ symbol: req.body.symbol }, {
                    $set: { units: units, totalValue: totalValue }
                }).exec().then(result => {
                    // 3. find user wallet
                    User.findOne({ email: userEmail }).exec().then(user => {
                        console.log(user);
                        if (user) {
                            var userWallet = user.wallet //amount in user wallet
                            userWallet += userAmount;
                            // 4.update userWallet
                            User.updateOne({ email: userEmail }, {
                                $set: { wallet: userWallet }
                            }).exec().then(result => {
                                // 5.update user portfolio
                                UserPortfolio.findOne({ email: userEmail, symbol: req.body.symbol }).exec().then(userPortfolio => {
                                    console.log(userPortfolio);
                                    // 5a.if portfolio exists update it
                                    if (userPortfolio) {
                                        var portfolioUnits = userPortfolio.stockUnits;
                                        portfolioUnits -= userUnits;
                                        UserPortfolio.updateOne({ email: userEmail, symbol: req.body.symbol }, {
                                            $set: { stockUnits: portfolioUnits }
                                        }).exec().then(result => {
                                            createTransaction(); //6. Creating Sell Logs 
                                        });

                                    } else { //5b . if not create new portfolio
                                        const userPortfolio = new UserPortfolio({
                                            _id: new mongoose.Types.ObjectId(),
                                            email: req.body.email,
                                            symbol: req.body.symbol,
                                            stockUnits: userUnits,
                                            baseValueEntry: baseValue,
                                            baseValueLast: baseValue,
                                            baseCurrency: baseCurrency
                                        });
                                        userPortfolio.save().then(result => {
                                            createTransaction();//6. Creating Sell Logs 
                                        });
                                    }
                                })


                            })
                        }
                    })
                })


            }
            else {
                res.status(404)
                    .json({ message: "No valid entry found for provided product symbol" });
            }
        });

});

function createTransaction() {
    console.log("Creating Sell Logs");
}









module.exports = router;