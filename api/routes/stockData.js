const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance");
const BuySellTransactions = require("../models/buySellTransactions");
const axios = require("axios");
const ProductHistory = require("../models/productHistory");

router.post("/portfolioChart", async (req, res, next) => {
  let logs;
  let localCurrency = req.body.localCurrency;
  try {
    logs = await BuySellTransactions.find({ emailId: req.body.email }).sort({
      date: 1
    });
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }
  // console.log(logs);
  let sDate, eDate;
  let datesArray = [];
  let productList = [];
  let portfolioSpend, portfolioCurrent, gain;
  let currentDate = await formatDateYYYYmmDD(new Date());
  // sDate = currentDate;
  // console.log("currentDate", currentDate);
  if (logs.length > 0) {
    portfolioSpend = 0;

    // iterate the logs
    for (i = 0; i < logs.length; i++) {
      gain = 0;
      eDate = await formatDateYYYYmmDD(logs[i].date);

      // break forloop if currentDate ------------
      if (eDate == currentDate) {
        console.log("current date break", eDate);

        // calculate amount Spend
        if (logs[i].type == "buy") {
          portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
        } else if (logs[i].type == "sell") {
          portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
        }

        // get current portfolio values
        var cDatePortfolio = 0;
        const lPrice = await getLiveQoute(logs[i].symbol, localCurrency);
        cDatePortfolio += parseFloat(logs[i].units) * parseFloat(lPrice);
        // calculate gain
        gain = cDatePortfolio - portfolioSpend;
        // create dates object
        var datesObj = {
          date: eDate,
          portfolioSpend: portfolioSpend,
          portfolioCurrent: cDatePortfolio,
          gain: gain
        };
        // push datesObj to datesArray
        datesArray.push(datesObj);
      }

      if (eDate !== currentDate && i == 0) {
        sDate = await formatDateYYYYmmDD(logs[i].date);
        console.log("1.", sDate);

        // calculate amount Spend
        if (logs[i].type == "buy") {
          portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
        } else if (logs[i].type == "sell") {
          portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
        }

        var currentDatePortfolio = 0;

        var portfolioHistoryValue = await getHistory(
          sDate,
          logs[i].symbol,
          localCurrency
        );
        currentDatePortfolio +=
          parseFloat(logs[i].units) * parseFloat(portfolioHistoryValue);
        // console.log("---", currentDatePortfolio);

        // console.log(currentDatePortfolio, portfolioSpend);
        gain = currentDatePortfolio - portfolioSpend;

        var datesObj = {
          date: sDate,
          portfolioSpend: portfolioSpend,
          portfolioCurrent: currentDatePortfolio,
          gain: gain
        };
        // console.log(datesObj);
        datesArray.push(datesObj);
        sDate = eDate;

        //  add to productList array
        var dictObject = {
          symbol: logs[i].symbol,
          units: logs[i].units,
          price: logs[i].basePrice
        };
        // console.log("add to dict", dictObject);
        productList.push(dictObject);
      } else if (i > 0) {
        // if not first transaction
        if (eDate == sDate) {
          console.log("edate == sdate");
          // add symbol to object array -----------------------------------------------
          var foundIndex = productList.findIndex(
            x => x.symbol == logs[i].symbol
          );

          // if product found in the list
          if (foundIndex >= 0) {
            if (logs[i].type == "buy") {
              productList[foundIndex].units += parseFloat(logs[i].units);
            } else if (logs[i].type == "sell") {
              // console.log("sell**");
              productList[foundIndex].units -= parseFloat(logs[i].units);
            }
          } else {
            var dictObject = {
              symbol: logs[i].symbol,
              units: logs[i].units,
              price: logs[i].basePrice
            };
            // console.log("add to dict", dictObject);
            productList.push(dictObject);
          }
          // console.log(productList);---------------------------------------------------

          // calculate amount Spend
          if (logs[i].type == "buy") {
            portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
          } else if (logs[i].type == "sell") {
            portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
          }

          var currentDatePortfolio = 0;

          // calculate currentDatePortfolio
          for (const element of productList) {
            // console.log(element);
            var portfolioHistoryValue = await getHistory(
              sDate,
              logs[i].symbol,
              localCurrency
            );
            currentDatePortfolio +=
              parseFloat(element.units) * parseFloat(portfolioHistoryValue);
            // console.log("---", currentDatePortfolio);
          }
          // calculate gain
          gain = currentDatePortfolio - portfolioSpend;

          // find the dateObject from datesArray and change the values

          let objDates = datesArray.find(o => o.date === eDate);
          // console.log(objDates);
          objDates.portfolioSpend = portfolioSpend;
          (objDates.portfolioCurrent = currentDatePortfolio),
            (objDates.gain = gain);
          sDate = eDate;
        }
        if (eDate !== sDate) {
          console.log("eDate !== sDate");

          // // calculate amount Spend
          // if (logs[i].type == "buy") {
          //   portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
          // } else if (logs[i].type == "sell") {
          //   portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
          // }
          // generate data between startDate and endDate
          let startDate = await getNextDay(sDate);
          while (startDate !== eDate) {
            // code block to be executed
            currentDatePortfolio = 0;

            for (const element of productList) {
              // console.log(element);
              var portfolioHistoryValue = await getHistory(
                startDate,
                element.symbol,
                localCurrency
              );
              currentDatePortfolio +=
                parseFloat(element.units) * parseFloat(portfolioHistoryValue);
            }

            gain = currentDatePortfolio - portfolioSpend;
            // console.log(startDate, portfolioSpend, currentDatePortfolio);
            var datesObj = {
              date: startDate.toString(),
              portfolioSpend: portfolioSpend,
              portfolioCurrent: currentDatePortfolio,
              gain: gain
            };
            // console.log(datesObj);
            datesArray.push(datesObj);

            startDate = await getNextDay(startDate);
          }
          // fetch data of edate
          if (startDate == eDate) {
            // add symbol to object array -----------------------------------------------
            var foundIndex = productList.findIndex(
              x => x.symbol == logs[i].symbol
            );

            // if product found in the list
            if (foundIndex >= 0) {
              if (logs[i].type == "buy") {
                productList[foundIndex].units += parseFloat(logs[i].units);
              } else if (logs[i].type == "sell") {
                // console.log("sell**");
                productList[foundIndex].units -= parseFloat(logs[i].units);
              }
            } else {
              var dictObject = {
                symbol: logs[i].symbol,
                units: logs[i].units,
                price: logs[i].basePrice
              };
              // console.log("add to dict", dictObject);
              productList.push(dictObject);
            }
            // console.log(productList);---------------------------------------------------

            // calculate amount Spend
            if (logs[i].type == "buy") {
              portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
            } else if (logs[i].type == "sell") {
              portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
            }

            var currentDatePortfolio = 0;

            // calculate currentDatePortfolio
            for (const element of productList) {
              // console.log(element);
              var portfolioHistoryValue = await getHistory(
                startDate,
                logs[i].symbol,
                localCurrency
              );
              currentDatePortfolio +=
                parseFloat(element.units) * parseFloat(portfolioHistoryValue);
              // console.log("---", currentDatePortfolio);
            }
            // calculate gain
            gain = currentDatePortfolio - portfolioSpend;

            var datesObj = {
              date: eDate,
              portfolioSpend: portfolioSpend,
              portfolioCurrent: currentDatePortfolio,
              gain: gain
            };
            // console.log(datesObj);
            datesArray.push(datesObj);
          }

          sDate = startDate;
        }
      }
    }

    // incement the date and generate the chart till currentdate
    console.log("Sdate-" + sDate + ",currentDate-" + currentDate);
    // sDate = await getNextDay(sDate);
    if (typeof sDate !== "undefined" && currentDate !== sDate) {
      // console.log("ssss-",currentDate, sDate);
      while (sDate !== currentDate) {
        // code block to be executed
        currentDatePortfolio = 0;

        for (const element of productList) {
          // console.log(element);
          var portfolioHistoryValue = await getHistory(
            sDate,
            element.symbol,
            localCurrency
          );
          currentDatePortfolio +=
            parseFloat(element.units) * parseFloat(portfolioHistoryValue);
        }

        gain = currentDatePortfolio - portfolioSpend;
        // console.log(startDate, portfolioSpend, currentDatePortfolio);
        var datesObj = {
          date: sDate.toString(),
          portfolioSpend: portfolioSpend,
          portfolioCurrent: currentDatePortfolio,
          gain: gain
        };
        // console.log(datesObj);
        datesArray.push(datesObj);

        sDate = await getNextDay(sDate);
      }
    }
    // console.log(datesArray.reverse());
    try {
      res.send(datesArray.reverse());
    } catch (err) {
      res.status(500).json({
        message: "No Portfolio Transactions"
      });
    }
  } else {
    res.status(400).json({
      message: "No Portfolio Transactions"
    });
  }
});

router.post("/portfolioMap", async (req, res, next) => {
  let email = req.body.email;
  let localCurrency = req.body.localcurrency;
  let logs, endDate, startDate, portfolioSpend;
  let datesArray = [];

  // search for portfolio transactions from BuySellTransactions
  try {
    logs = await BuySellTransactions.find({ emailId: req.body.email }).sort({
      date: 1
    });
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }

  // check wether empty portfolio or not
  if (logs.length > 0) {
    portfolioSpend = 0;
    // iterate through existing portfolio
    for (i = 0; i < logs.length; i++) {
      endDate = logs[i].date;

      // get date of first transaction
      if (compareUTCdate(logs[i].date)) {
        // set the portfolioSpend to 0
        portfolioSpend = 0;
        console.log("it is today", logs[i].date);

        // format endDate to yyyy-mm-dd
        endDate = new Date(endDate).toISOString().slice(0, 10);
        console.log(endDate);

        // check for date in dates array
        let obj = datesArray.find(x => x.date === endDate);
        if (obj) {
          portfolioSpend = parseFloat(obj.portfolioSpend);
          // get current portfolio values
          var currentDatePortfolio = parseFloat(obj.portfolioSpend);
          var localCurrentPrice = await getLiveQoute(
            logs[i].symbol,
            localCurrency
          );

          // calculate portfolio amount Spend
          if (logs[i].type == "buy") {
            portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
            currentDatePortfolio +=
              parseFloat(logs[i].units) * parseFloat(localCurrentPrice);
          } else if (logs[i].type == "sell") {
            portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
            currentDatePortfolio -=
              parseFloat(logs[i].units) * parseFloat(localCurrentPrice);
          }
          const gain = currentDatePortfolio - portfolioSpend;
          let index = datesArray.indexOf(obj);
          datesArray.fill(
            (obj.portfolioSpend = portfolioSpend),
            (obj.portfolioCurrent = currentDatePortfolio),
            (obj.gain = gain)
          );

        } else {
          // calculate portfolio amount Spend
          if (logs[i].type == "buy") {
            portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
          } else if (logs[i].type == "sell") {
            portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
          }
          var currentDatePortfolio = 0;
          var localCurrentPrice = await getLiveQoute(
            logs[i].symbol,
            localCurrency
          );
          currentDatePortfolio +=
            parseFloat(logs[i].units) * parseFloat(localCurrentPrice);
          const gain = currentDatePortfolio - portfolioSpend;
          // create dates object
          var datesObj = {
            date: endDate,
            portfolioSpend: portfolioSpend,
            portfolioCurrent: currentDatePortfolio,
            gain: gain
          };
          // push datesObj to datesArray
          datesArray.push(datesObj);
        }
      }
      else {
        if (i == 0) {
          console.log("yahoo", endDate);
          // calculate portfolio amount Spend
          if (logs[i].type == "buy") {
            portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
          } else if (logs[i].type == "sell") {
            portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
          }
          var currentDatePortfolio = 0;
          var localCurrentPrice = await getHistory(endDate, logs[i].symbol, localCurrency);
          currentDatePortfolio +=
            parseFloat(logs[i].units) * parseFloat(localCurrentPrice);
          const gain = currentDatePortfolio - portfolioSpend;
          // create dates object
          var datesObj = {
            date: endDate,
            portfolioSpend: portfolioSpend,
            portfolioCurrent: currentDatePortfolio,
            gain: gain
          };
          // push datesObj to datesArray
          datesArray.push(datesObj);

        }
      }



    }
    res.send(datesArray);
  } else {
    res.status(400).json({
      message: "No Portfolio Transactions"
    });
  }
});

router.get("/weekly/:symbol", async (req, res, next) => {
  let fromDate = await getFromDate(84);
  console.log(fromDate);
  fromDate = await formatDateYYYYmmDD(fromDate);
  console.log(fromDate);

  let currentdate = getCurrentDate();
  currentdate = await formatDateYYYYmmDD(currentdate);

  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: currentdate,
      period: "w"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if (err) {
        console.log(err);
        res.status(500).json({
          error: err
        });
      } else res.send(quotes);
    }
  );

  // yahooFinance.quote(
  //   {
  //     symbol: req.params.symbol,
  //     modules: ["financialData", "earnings"] // see the docs for the full list
  //   },
  //   function(err, quotes) {
  //     res.status(200).json({
  //       quotes: quotes
  //     });
  //   }
  // );
});

router.get("/monthly/:symbol", async (req, res, next) => {
  let fromDate = await getFromDate(4380);
  console.log(fromDate);
  fromDate = await formatDateYYYYmmDD(fromDate);
  console.log(fromDate);

  let currentdate = getCurrentDate();
  currentdate = await formatDateYYYYmmDD(currentdate);

  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: currentdate,
      period: "m"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if (err) {
        console.log(err);
        res.status(500).json({
          error: err
        });
      } else res.send(quotes);
    }
  );

  // yahooFinance.quote(
  //   {
  //     symbol: req.params.symbol,
  //     modules: ["financialData", "earnings"] // see the docs for the full list
  //   },
  //   function(err, quotes) {
  //     res.status(200).json({
  //       quotes: quotes
  //     });
  //   }
  // );
});

router.get("/daily/:symbol", async (req, res, next) => {
  let fromDate = await getFromDate(20);
  fromDate = await formatDateYYYYmmDD(fromDate);
  console.log(fromDate);

  let currentdate = getCurrentDate();
  currentdate = await formatDateYYYYmmDD(currentdate);
  console.log(currentdate);
  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: currentdate,
      period: "d"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if (err) {
        console.log(err);
        res.status(500).json({
          error: err
        });
      } else res.send(quotes);
    }
  );

  // yahooFinance.quote(
  //   {
  //     symbol: req.params.symbol,
  //     modules: ["financialData", "earnings"] // see the docs for the full list
  //   },
  //   function(err, quotes) {
  //     res.status(200).json({
  //       quotes: quotes
  //     });
  //   }
  // );
});

// get current date
function getCurrentDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!
  var yyyy = today.getFullYear();

  if (dd < 10) {
    dd = "0" + dd;
  }

  if (mm < 10) {
    mm = "0" + mm;
  }

  today = mm + "/" + dd + "/" + yyyy;
  return today;
}

// Returns an array of dates between the two dates
var getDates = function(startDate, endDate) {
  var dates = [],
    currentDate = startDate,
    addDays = function(days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };
  while (currentDate <= endDate) {
    currentDate = formatDate(currentDate);
    // console.log(currentDate);
    dates.push(currentDate);
    currentDate = addDays.call(currentDate, 1);
  }
  return dates;
};

// format date to {month-date-year}
function formatDate(currentDate) {
  var date = currentDate.getDate();
  var month = currentDate.getMonth();
  var year = currentDate.getFullYear();
  var monthDateYear = month + 1 + "-" + date + "-" + year;
  return monthDateYear;
}

// function to get date of nextDay
async function getNextDay(day) {
  var nextDay = new Date(day);
  nextDay.setDate(nextDay.getDate() + 1);
  // console.log("**",await formatDateYYYYmmDD(nextDay));
  return await formatDateYYYYmmDD(nextDay);
}

// function to format date YYYYmmDD
async function formatDateYYYYmmDD(date) {
  var d = new Date(date),
    month = "" + (d.getMonth() + 1),
    day = "" + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [year, month, day].join("-");
}

//function to substract date
async function getFromDate(days) {
  var date = new Date();
  var last = new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
  // var day = last.getDate();
  // var month = last.getMonth() + 1;
  // var year = last.getFullYear();
  return last;
}

// function to return product history prices
async function getHistory(startDate, symbol, localCurrency) {
  var date = await formatDateYYYYmmDD(startDate);
  console.log(date,symbol,localCurrency);
  let historyResult = await ProductHistory.findOne({
    symbol: symbol,
    date: date
  });

  let currentAmount =
    parseFloat(historyResult.price) * parseFloat(historyResult[localCurrency]);
  // console.log("Current Amount", currentAmount);
  return currentAmount;
}

async function getLiveQoute(symbol, localCurrency) {
  const result = await yahooFinance.quote(symbol);
  const price = result["price"]["regularMarketPrice"];
  // console.log(price);
  const currency = result["price"]["currency"];

  // calculate the forex
  const forex = await axios.get(
    "https://api.exchangeratesapi.io/latest?base=" +
      currency +
      "&symbols=" +
      localCurrency
  );

  let exgRate = parseFloat(forex.data["rates"][localCurrency]);
  const lcPrice = price * exgRate;
  return lcPrice;
}
function compareUTCdate(givenDate) {
  var GivenDate;
  var CurrentDate = new Date();   
  GivenDate = new Date(givenDate);
  // console.log(GivenDate,CurrentDate);
  GivenDate = new Date(GivenDate).toISOString().slice(0, 10);
  CurrentDate = new Date(CurrentDate).toISOString().slice(0, 10);
  if ((GivenDate === CurrentDate)) {
    return true;
  } else {
    return false;
  }
}
module.exports = router;
