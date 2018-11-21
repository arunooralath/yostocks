const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const UserPortfolio = require("../models/userPortfolio");
const User = require("../models/user");
const BuyTransactions = require("../models/buyTransactions");

router.post("/buy", (req, res, next) => {
  var wBasevalue, wUnits, wTotalValue;
  WarehouseStock.findOne({ symbol: req.body.symbol })
    .exec()
    .then(doc => {
      if (doc) {
        //if stock found reduce the stock from warehouse
        wBasevalue = doc.baseValue; //basevalue of stock warehouse
        wUnits = doc.units; //Stock units in Warehouse
        wTotalValue = doc.totalValue; //Total value of stock in Warehouse

        console.log(req.body.units, doc.units);
        // Check if adequete amount of units present in stock
        if (req.body.units <= wUnits) {
          wUnits = wUnits - req.body.units;
          wTotalValue = wBasevalue * wUnits;

          console.log(wBasevalue, wUnits, wTotalValue, req);
          var response = createBuyTransaction(
            wBasevalue,
            wUnits,
            wTotalValue,
            req
          );
          res.send(response);
        } else {
          //Update warehouse Stock and proceed;
          console.log("Update warehouse Stock");
        }
      } else {
        //return no stock found
        res.status(500).json({
          error: "warehouse stock not found"
        });
      }
    });
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
        userAmount = req.body.amount; //amount entered by user
        baseValue = doc.baseValue; //basevalue on server
        units = doc.units; //Units of product available on server
        totalValue = doc.totalValue; //total value of stock on server.
        baseCurrency = doc.baseCurrency; //basecurrency of the warehouseStock

        // if(userbaseValue == baseValue){
        //     // make the sell

        // }

        userUnits = userAmount / baseValue;
        units = units + userUnits; //add the number of units to warehouseStock
        totalValue = baseValue * units;
        // 2. update WarehouseStock
        WarehouseStock.updateOne(
          { symbol: req.body.symbol },
          {
            $set: { units: units, totalValue: totalValue }
          }
        )
          .exec()
          .then(result => {
            // 3. find user wallet
            User.findOne({ email: userEmail })
              .exec()
              .then(user => {
                console.log(user);
                if (user) {
                  var userWallet = user.wallet; //amount in user wallet
                  userWallet += userAmount;
                  // 4.update userWallet
                  User.updateOne(
                    { email: userEmail },
                    {
                      $set: { wallet: userWallet }
                    }
                  )
                    .exec()
                    .then(result => {
                      // 5.update user portfolio
                      UserPortfolio.findOne({
                        email: userEmail,
                        symbol: req.body.symbol
                      })
                        .exec()
                        .then(userPortfolio => {
                          console.log(userPortfolio);
                          // 5a.if portfolio exists update it
                          if (userPortfolio) {
                            var portfolioUnits = userPortfolio.stockUnits;
                            portfolioUnits -= userUnits;
                            UserPortfolio.updateOne(
                              { email: userEmail, symbol: req.body.symbol },
                              {
                                $set: { stockUnits: portfolioUnits }
                              }
                            )
                              .exec()
                              .then(result => {
                                createTransaction(); //6. Creating Sell Logs
                              });
                          } else {
                            //5b . if not create new portfolio
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
                              createTransaction(); //6. Creating Sell Logs
                            });
                          }
                        });
                    });
                }
              });
          });
      } else {
        res.status(404).json({
          message: "No valid entry found for provided product symbol"
        });
      }
    });
});

router.post("/buystock", async (req, res, next) => {
  console.log(req.body.email);
  let user;
  let stock;
  let portfolio;
  let newBuyTransactions;
  var amountBC = parseFloat(req.body.amountBC);
  var wBasevalue, wUnits, wTotalValue, wBaseCurrency; //WarehouseStock variable
  var pUnits, pBasevalue; //portfolio variable
  try {
    user = await User.findOne({ email: req.body.email });
    stock = await WarehouseStock.findOne({ symbol: req.body.symbol });
    portfolio = await UserPortfolio.findOne({
      email: req.body.email,
      symbol: req.body.symbol
    });
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }

  // if User wallet ok
  if (user && amountBC <= user.wallet) {
    wUnits = stock.units; //WarehouseStock units
    wBasevalue = stock.baseValue;
    var buyUnits = wBasevalue / amountBC; //units to be bought
    wBaseCurrency = stock.baseCurrency;
    // if stock of product found
    if (stock) {
      // if stock quantity available
      if (buyUnits <= wUnits) {
        // complete transaction
        console.log(buyUnits, wUnits);

        // update the user wallet
        var userWallet = parseFloat(user.wallet);
        userWallet = userWallet - amountBC;

        await User.updateOne(
          { email: req.body.email },
          {
            $set: { wallet: userWallet }
          }
        );

        // update WarehouseStock
        wUnits = stock.units - buyUnits;
        wTotalValue = wBasevalue * wUnits;
        await WarehouseStock.updateOne(
          { symbol: req.body.symbol },
          { $set: { units: wUnits, totalValue: wTotalValue } }
        );

        // Update portfolio
        if (portfolio) {
          pUnits = parseFloat(portfolio.stockUnits);
          pUnits += buyUnits;
          await UserPortfolio.updateOne(
            { email: req.body.email, symbol: req.body.symbol },
            { $set: { stockUnits: pUnits, baseValueLast: wBasevalue } }
          );
        } else {
          // if no portfolio entry then create new record
          const userPortfolio = new UserPortfolio({
            _id: new mongoose.Types.ObjectId(),
            email: req.body.email,
            symbol: req.body.symbol,
            stockUnits: buyUnits,
            baseValueEntry: wBasevalue,
            baseValueLast: wBasevalue,
            baseCurrency: wBaseCurrency
          });
          try {
            await userPortfolio.save();
          } catch (err) {
            res.status(500).json({
              error: err
            });
          }
        }
        // create and save newBuyTransactions
        const buyTransaction = new BuyTransactions({
          _id: new mongoose.Types.ObjectId(),
          email: req.body.email,
          symbol:req.body.symbol,
          units: buyUnits,
          basePrice:wBasevalue,
          baseCurrencyAmount: amountBC,
          localCurrencyAmount: req.body.amountLC,
          baseCurrency: wBaseCurrency          
        });
        try{
          newBuyTransactions = await buyTransaction.save();
          
        }
        catch(err){
          console.log("err at last")
          res.status(500).json({
            error: err
          });
        }
        res.send(newBuyTransactions);

      } else {
        // Update warehouse stock and then complete transaction
        res.send("update wsStock complete Transaction");
      }
    } else {
      sendError(res);
    }

    res.send(user);
  } else {
    res.status(401).json({
      message: "Insufficient wallet Balance"
    });
  }
});

function sendError(res) {
  res.status(401).json({
    message: "UnAuthorised"
  });
}

function createTransaction() {
  console.log("Creating Sell Logs");
}

async function createBuyTransaction(wBasevalue, wUnits, wTotalValue, req) {
  let response = {};
  // update warehouse stock
  try {
    await WarehouseStock.updateOne(
      { symbol: req.body.symbol },
      {
        $set: { units: wUnits, totalValue: wTotalValue }
      }
    );
  } catch (err) {
    console.log("Http error", err);
    return res.status(500).send();
  }
  // update user wallet
  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      console.log("user found", user);
      await User.updateOne(
        { email: req.body.email },
        {
          $set: { wallet: user.wallet - wBasevalue * wUnits }
        }
      );
    }
  } catch (err) {
    console.log("Http error", err);
    return res.status(500).send();
  }
  return response;
}

async function findUser(useremail) {}

module.exports = router;
