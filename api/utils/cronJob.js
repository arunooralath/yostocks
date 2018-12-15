var CronJob = require("cron").CronJob;
const mongoose = require("mongoose");
const axios = require("axios");
const _ = require("lodash");
const WareHouseStock = require("../models/warehouseStock");

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
  let stocks = await WareHouseStock.find();
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
    qoute.forEach(function(value, i) {
      console.log(qoute[i].symbol);
      console.log(qoute[i].price)
    });
  } catch (err) {
    console.log(err);
  }
}
