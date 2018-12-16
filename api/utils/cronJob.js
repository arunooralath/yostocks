var CronJob = require("cron").CronJob;
const mongoose = require("mongoose");
const axios = require("axios");
const _ = require("lodash");
const WareHouseStock = require("../models/warehouseStock");
const UserPortfolio = require("../models/userPortfolio");

module.exports = {
  start: function() {
    console.log("Start cron job");
    new CronJob(
      "0 */1 * * * *",
      function() {
        console.log("You will see this message at 13:07 LA TimeZone");
        var stock = updateStocks();
      },
      null,
      true,
      "America/Los_Angeles"
    );
  },
  stop: function() {
    console.log("Stop cron job");
  }
};

async function updateStocks() {
  let stockList = [];
  let symbolList = [];
  let stocks = await WareHouseStock.find();
  let userPortfolio;
  for (i = 0; i < stocks.length; i++) {
    stockList.push(stocks[i].symbol);
  }
  console.log(stockList.toString());
  const url =
    "https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=" +
    stockList.toString() +
    "&apikey=UDRGPJK0RAK1RIUT";

  try {
    const response = await axios.get(url);
    let qoute = _.flattenDeep(
      Array.from(response.data["Stock Quotes"]).map(stock => [
        {
          symbol: stock["1. symbol"],
          price: stock["2. price"],
          volume: stock["3. volume"],
          timestamp: stock["4. timestamp"]
        }
      ])
    );

    // create symbolList Array of realtime prices
    qoute.forEach(function(value, i) {
      // console.log(qoute[i].symbol);
      // console.log(qoute[i].price)
      let qouteObj = {
        symbol: qoute[i].symbol,
        price: qoute[i].price
      };
      symbolList.push(qouteObj);
      // console.log(qouteObj);
    });

    // loop to iterate WareHouseStock and update values
    for (i = 0; i < stocks.length; i++) {
      let rltPrice; //realtime price
      let baseValue, units, totalValue, preBaseValue; //variables for warehousestock

      baseValue = stocks[i].baseValue;
      units = parseFloat(stocks[i].units);
      totalValue = parseFloat(stocks[i].totalValue);
      preBaseValue = baseValue;
      let obj = symbolList.find(o => o.symbol == stocks[i].symbol);
      // console.log(stocks[i].symbol, obj);
      baseValue = parseFloat(obj.price);
      totalValue = baseValue * units;
      // console.log(baseValue, preBaseValue, units, totalValue);

      // update WareHouseStock Table with realtime value
      await WareHouseStock.updateOne(
        { symbol: stocks[i].symbol },
        {
          $set: {
            baseValue: baseValue,
            preBaseValue: preBaseValue,
            totalValue: totalValue
          }
        }
      );
    }

    // fetch userPortfolio from DB
    userPortfolio = await UserPortfolio.find();

    // for (i = 0; i < userPortfolio.length; i++) {
    //   console.log(userPortfolio[i].symbol);
    //   let obj = symbolList.find(o => o.symbol == userPortfolio[i].symbol);

    // }

    for (i = 0; i < symbolList.length; i++) {
      var symbol = symbolList[i].symbol.toString();
      await UserPortfolio.updateMany(
        { symbol: symbol },
        {
          $set: {
            baseValueLast: symbolList[i].price
          }
        }
      );
    }
  } catch (err) {
    console.log(err);
  }
}
