var CronJob = require("cron").CronJob;
const mongoose = require("mongoose");
const axios = require("axios");
const _ = require("lodash");
const Products = require("../models/product");
const productHistory = require("../models/productHistory");

module.exports = {
  start: function() {
    // console.log("Start - Update History Job");
    new CronJob(
      "0 */1 * * * *",
      function() {
        console.log("You will see this message at 13:07 LA TimeZone");
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
    console.log(frxRes.data.rates.HUF);
    // forexQoute = _.flattenDeep(
    //   Array.from(frxRes.data.rates).map(list => [
    //     {
    //       HUF: list.HUF,
    //       // NOK: list["NOK"],
    //       // ISK: list["ISK"],
    //       // EUR: list["EUR"],
    //       // PLN: list["PLN"],
    //       // SEK: list["SEK"],
    //       // DKK: list["DKK"]
    //     }
    //   ])
    // );
    // console.log(forexQoute);

    for (i = 0; i < symbolList.length; i++) {
      var history = new productHistory({
        _id: new mongoose.Types.ObjectId(),
        symbol: symbolList[i].symbol,
        price: symbolList[i].price,
        HUF: frxRes.data.rates.HUF,
        NOK: frxRes.data.rates.NOK,
        ISK: frxRes.data.rates.ISK,
        EUR: frxRes.data.rates.EUR,
        PLN: frxRes.data.rates.PLN,
        SEK: frxRes.data.rates.SEK,
        DKK: frxRes.data.rates.DKK
      });
      console.log(history);
    }
  } catch (err) {
    console.log(err);
  }
}
