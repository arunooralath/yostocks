const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const WarehouseStock = require("../models/warehouseStock");
const UserPortfolio = require("../models/userPortfolio");
const User = require("../models/user");
const BuySellTransactions = require("../models/buySellTransactions");
const axios = require("axios");

router.post("/sellstock", async (req, res, next) => {
  console.log(req.body.email);

  let user;
  let stock;
  let portfolio;
  var pUnits, pBasevalue;
  var sellUnits, sellAmount;
  var wUnits,
    wTotalValue,
    wBaseValue,
    wBaseCurrency,
    amountBC,
    brandname,
    amountLC;
  // fetch user,stock,portfolio
  try {
    user = await User.findOne({ email: req.body.email });
    stock = await WarehouseStock.findOne({ symbol: req.body.symbol });
    portfolio = await UserPortfolio.findOne({
      email: req.body.email,
      symbol: req.body.symbol
    });
  } catch (err) {
    console.log("error fetching");
    res.status(500).json({
      error: err
    });
  }
  // if portfolio,stock and user exists
  if (portfolio && user && stock) {
    console.log("portfolio && user && stock");

    pUnits = parseFloat(portfolio.stockUnits); //portfolio units
    wBaseCurrency = stock.baseCurrency; //Stock base currency
    brandname = stock.brandname;

    let realBasePrice = parseFloat(stock.baseValue);

    const forex = await axios.get(
      "https://api.exchangeratesapi.io/latest?base=" +
        req.body.localcurrency +
        "&symbols=" +
        wBaseCurrency
    );

    let exgRate = parseFloat(forex.data["rates"][wBaseCurrency]);

    amountLC = parseFloat(req.body.amountLC);
    amountBC = amountLC * exgRate;
    wBaseValue = realBasePrice;
    sellUnits = amountBC / wBaseValue; //user selling units
    // check if sellunits < = punits
    if (sellUnits <= pUnits) {
      console.log("sellUnits <= pUnits");

      try {
        wUnits = parseFloat(stock.units); //warehousestock Units
        // wBaseValue = parseFloat(stock.baseValue); //warehousestock basevalue
        wTotalValue = parseFloat(stock.totalValue); //warehousestock total
        wBaseCurrency = stock.baseCurrency; //Stock base currency

        // update WarehouseStock
        wUnits += sellUnits; //update warehousestock Units
        wTotalValue = wUnits * wBaseValue;
        await WarehouseStock.updateOne(
          { symbol: req.body.symbol },
          {
            $set: {
              units: wUnits,
              totalValue: wTotalValue
            }
          }
        );
      } catch (err) {
        console.log("update WarehouseStock");
        res.status(500).json({
          error: err
        });
      }

      try {
        // update porfolio stocks
        pUnits -= sellUnits;
        await UserPortfolio.updateOne(
          { email: req.body.email, symbol: req.body.symbol },
          { $set: { stockUnits: pUnits, baseValueLast: wBaseValue } }
        );
      } catch (err) {
        console.log("update porfolio stocks");
        res.status(500).json({
          error: err
        });
      }

      try {
        // update user wallet
        var userWallet = parseFloat(user.wallet);
        userWallet = userWallet + amountBC;
        await User.updateOne(
          { email: req.body.email },
          {
            $set: { wallet: userWallet }
          }
        );
      } catch (err) {
        console.log("update user wallet");
        res.status(500).json({
          error: err
        });
      }

      var wbv = stock.baseValue;
      var wbc = stock.baseCurrency;

      // create and save newBuyTransactions
      const sellTransaction = new BuySellTransactions({
        _id: new mongoose.Types.ObjectId(),
        type: "sell",
        emailId: req.body.email,
        symbol: req.body.symbol,
        brandname: brandname,
        units: sellUnits,
        basePrice: wbv,
        baseCurrencyAmount: amountBC,
        localCurrencyAmount: req.body.amountLC,
        baseCurrency: wbc
      });

      console.log(sellTransaction);

      sellTransaction
        .save()
        .then(result => {
          console.log("Sell Transaction then");
          res.send(result);
        })
        .catch(err => {
          console.log(err);
          res.status(500).json({
            error: err
          });
        });

      // var newSellTransactions = await sellTransaction.save();
      // console.log("newSellTransactions ", newSellTransactions);
      // res.send(newSellTransactions);
    } else {
      res.status(401).json({
        err: "Unautorised",
        msg: "No stock units in portfolio"
      });
    }
  } else {
    res.status(401).json({
      err: "Unautorised",
      msg: "No such portfolio or user or warehouseStock"
    });
  }
});

router.post("/buystock", async (req, res, next) => {
  let user;
  let stock;
  let portfolio;
  let localCurrency = req.body.localcurrency;
  var amountLC, amountBC;
  var wBasevalue, wUnits, wTotalValue, wBaseCurrency, wBrandName; //WarehouseStock variable
  var pUnits, pBasevalue; //portfolio variable
  console.log("body", req.body.email);
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
  console.log(stock);
  // if stock of product found
  if (stock) {
    wBrandName = stock.brandname;
    wBaseCurrency = stock.baseCurrency;

    // calculate Units with realtime Stock data
    amountLC = parseFloat(req.body.amountLC);

    let realBasePrice = parseFloat(stock.baseValue);

    const forex = await axios.get(
      "https://api.exchangeratesapi.io/latest?base=" +
        req.body.localcurrency +
        "&symbols=" +
        wBaseCurrency
    );

    let exgRate = parseFloat(forex.data["rates"][wBaseCurrency]);

    // convert amount in localCurrency to basecurrency
    amountBC = amountLC * exgRate;
    wBasevalue = realBasePrice;

    // if User wallet ok
    if (user && amountBC <= user.wallet) {
      wUnits = stock.units; //WarehouseStock units
      wBasevalue = stock.baseValue;
      var buyUnits = wBasevalue / amountBC; //units to be bought

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
          {
            $set: {
              units: wUnits,
              totalValue: wTotalValue
            }
          }
        );

        // Update portfolio
        if (portfolio) {
          pUnits = parseFloat(portfolio.stockUnits);
          pUnits += buyUnits;
          console.log("Update Portfolio");
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
            brandname: stock.brandname,
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
        const buyTransaction = new BuySellTransactions({
          _id: new mongoose.Types.ObjectId(),
          type: "buy",
          emailId: req.body.email,
          symbol: req.body.symbol,
          brandname: stock.brandname,
          units: buyUnits,
          basePrice: wBasevalue,
          baseCurrencyAmount: amountBC,
          localCurrencyAmount: req.body.amountLC,
          baseCurrency: wBaseCurrency
        });

        console.log("buy Transaction");

        buyTransaction
          .save()
          .then(result => {
            console.log("buy Transaction then");
            res.send(result);
          })
          .catch(err => {
            console.log(err);
            res.status(500).json({
              error: err
            });
          });

        /* try {
          newBuyTransactions = await buyTransaction.save();
        } catch (err) {
          console.log("err at last");
          res.status(500).json({
            error: err
          });
        } */
      } else {
        // Update warehouse stock and then complete transaction
        res.send("update wsStock complete Transaction");
      }
    } else {
      res.status(401).json({
        message: "Insufficient wallet Balance"
      });
    }
  } else {
    sendError(res);
  }
});

//sevice to confirm the buy transaction
router.post("/confirmbuy", async (req, res, next) => {
  // res.send(req.body);
  let user, stock, portfolio;
  let units, basePrice, totalValue, baseCurrency, wallet, localCurrency;
  localCurrency = req.body.localCurrency;
  // get the user object from DB
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

  basePrice = parseFloat(stock.baseValue);
  // if both user and stock exists
  if (user && stock) {
    wallet = user.wallet;
    units = stock.units;
    baseCurrency = stock.baseCurrency;
    // basePrice = parseFloat(stock.baseValue);
    console.log(wallet, units, baseCurrency, basePrice);
    totalValue = parseFloat(basePrice * units);

    await WarehouseStock.updateOne(
      { symbol: req.body.symbol },
      { $set: { baseValue: basePrice, totalValue: totalValue } }
    );
    // if portfolio exists
    if (portfolio) {
      try {
        await UserPortfolio.updateOne(
          { email: req.body.email, symbol: req.body.symbol },
          { $set: { baseValueLast: basePrice } }
        );
      } catch (err) {
        res.status(500).json({
          error: err
        });
      }
    }

    const forex = await axios.get(
      "https://api.exchangeratesapi.io/latest?base=" +
        baseCurrency +
        "&symbols=" +
        localCurrency
    );

    let exgRate = parseFloat(forex.data["rates"][localCurrency]);
    console.log(exgRate);
    let localcurrencyprice = basePrice * exgRate;
    let localwallet = wallet * exgRate;

    res.status(200).json({
      baseprice: basePrice,
      exchangeRate: exgRate,
      wallet: wallet,
      localwallet: localwallet,
      basecurrency: baseCurrency,
      stockUnits: units,
      localbaseprice: localcurrencyprice
    });
  } else {
    res.status(401).json({
      message: "UnAuthorised"
    });
  }
});

// service to confirm sell transaction
router.post("/confirmsell", async (req, res, next) => {
  // res.send(req.body);
  let user, stock, portfolio;
  let units, basePrice, totalValue, baseCurrency, portfolioUnits, localCurrency;
  localCurrency = req.body.localCurrency;
  // get the user object from DB
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
  console.log(stock);
  // update the WarehouseStock basePrice

  basePrice = parseFloat(stock.baseValue);
  // if both user and stock exists
  if (user && stock && portfolio) {
    portfolioUnits = portfolio.stockUnits;
    units = stock.units;
    baseCurrency = stock.baseCurrency;
    // basePrice = parseFloat(stock.baseValue);
    console.log(portfolioUnits, units, baseCurrency, basePrice);
    totalValue = parseFloat(basePrice * units);

    await WarehouseStock.updateOne(
      { symbol: req.body.symbol },
      { $set: { baseValue: basePrice, totalValue: totalValue } }
    );
    // if portfolio exists
    try {
      await UserPortfolio.updateOne(
        { email: req.body.email, symbol: req.body.symbol },
        { $set: { baseValueLast: basePrice } }
      );
    } catch (err) {
      res.status(500).json({
        error: err
      });
    }

    const forex = await axios.get(
      "https://api.exchangeratesapi.io/latest?base=" +
        baseCurrency +
        "&symbols=" +
        localCurrency
    );

    let exgRate = parseFloat(forex.data["rates"][localCurrency]);
    console.log(exgRate);

    let localcurrencyprice = basePrice * exgRate;

    res.status(200).json({
      baseprice: basePrice,
      portfolioUnits: portfolioUnits,
      basecurrency: baseCurrency,
      exchangeRate: exgRate,
      localbaseprice: localcurrencyprice
    });
  } else {
    res.status(401).json({
      message: "UnAuthorised"
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

function findElement(arr, propName, propValue) {
  for (var i = 0; i < arr.length; i++)
    if (arr[i][propName] == propValue) return arr[i];

  // will return undefined if not found; you could return a default instead
}

module.exports = router;
