var CronJob = require("cron").CronJob;
const mongoose = require("mongoose");
const axios = require("axios");
const _ = require("lodash");
const Products = require("../models/product");
const productHistory = require("../models/productHistory");
const utils = require("../utils/utils");

module.exports = {
  start: function() {
    // console.log("Start - Update History Job");
    new CronJob(
      // "0 */1 * * * *",
      "00 00 20 * * 0-7",
      function() {
        console.log("Add history values to DB");
        var history = updateHistory();
      },
      null,
      true,
      "America/Los_Angeles"
    );
  },
  stop: function() {
    console.log("Stop - Update History Job");
  }
};

async function updateHistory() {
  let productList = [];
  let products;
  let symbolList = [];
  let currencyList = [];
  let forexQoute;
  try {
    products = await Products.find();
    for (i = 0; i < products.length; i++) {
      productList.push(products[i].symbol);
    }
    console.log(productList.toString());
  } catch (err) {
    console.log(err);
  }

  const url =
    "https://www.alphavantage.co/query?function=BATCH_STOCK_QUOTES&symbols=" +
    productList.toString() +
    "&apikey=UDRGPJK0RAK1RIUT";

  const forexUrl =
    "https://api.exchangeratesapi.io/latest?base=USD&symbols=EUR,DKK,SEK,NOK,ISK,HUF,PLN";

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
    });
    console.log(symbolList);
  } catch (err) {
    console.log(err);
  }

  try {
    // get forexlist
    const frxRes = await axios.get(forexUrl);
    // console.log(frxRes.data.rates.HUF);

    for (i = 0; i < products.length; i++) {
      let symbl = symbolList.find(o => o.symbol == products[i].symbol);

      let laDate = utils.formatDateYYMMDD(utils.getCurrentLaDate());

      var history = new productHistory({
        _id: new mongoose.Types.ObjectId(),
        symbol: symbl.symbol,
        date: laDate,
        price: symbl.price,
        currency: products[i].currency,
        HUF: frxRes.data.rates.HUF,
        NOK: frxRes.data.rates.NOK,
        ISK: frxRes.data.rates.ISK,
        EUR: frxRes.data.rates.EUR,
        PLN: frxRes.data.rates.PLN,
        SEK: frxRes.data.rates.SEK,
        DKK: frxRes.data.rates.DKK
      });
      let result = await history.save();
      console.log(history);
    }
  } catch (err) {
    console.log(err);
  }
}
