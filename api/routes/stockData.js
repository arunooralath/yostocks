const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance");
const BuySellTransactions = require("../models/buySellTransactions");
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
  console.log("currentDate", currentDate);
  if (logs.length > 0) {
    portfolioSpend = 0;

    // iterate the logs
    for (i = 0; i < logs.length; i++) {
      gain = 0;
      eDate = await formatDateYYYYmmDD(logs[i].date);

      // break forloop if currentDate
      if (eDate == currentDate) break;

      if (i == 0) {
        sDate = await formatDateYYYYmmDD(logs[i].date);

        // calculate amount Spend
        if (logs[i].type == "buy") {
          portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
        } else if (logs[i].type == "sell") {
          portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
        }

        var currentDatePortfolio = 0;
        // console.log(currentDatePortfolio, sDate);

        // for (const element of productList) {
        //   console.log(element);
        //   var portfolioHistoryValue =  await getHistory(sDate,logs[i].symbol);
        //   currentDatePortfolio +=
        //     parseFloat(element.units) * parseFloat(portfolioHistoryValue);
        //     console.log("---",currentDatePortfolio);
        // }

        // get current portfolio status
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
      } else {
        // if not first transaction
        if (eDate == sDate) {
          // console.log("edate", eDate, " sdate", sDate, logs[i].symbol);

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
          // console.log("edate", eDate, " sdate", sDate, logs[i].symbol);
          // console.log("eDate !== sDate");

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
    sDate = await getNextDay(sDate);
    if (currentDate !== sDate) {
      console.log(currentDate, sDate);
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

router.get("/weekly/:symbol", async (req, res, next) => {

  let fromDate = await getFromDate(84);
  console.log(fromDate);
  fromDate = await formatDateYYYYmmDD(fromDate);
  console.log(fromDate);

  let currentdate = getCurrentDate();
  currentdate = formatDateYYYYmmDD(currentdate);

  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: "2018-12-20",
      period: "w"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if(err){
        console.log(err) 
        res.status(500).json({
          error:err
        })
      }      
      else    
      res.send(quotes);
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
  currentdate = formatDateYYYYmmDD(currentdate);

  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: "2018-12-20",
      period: "m"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if(err){
        console.log(err) 
        res.status(500).json({
          error:err
        })
      }      
      else    
      res.send(quotes);
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

  let fromDate = await getFromDate(13);
  console.log(fromDate);
  fromDate = await formatDateYYYYmmDD(fromDate);
  console.log(fromDate);

  let currentdate = getCurrentDate();
  currentdate = formatDateYYYYmmDD(currentdate);

  yahooFinance.historical(
    {
      symbol: req.params.symbol,
      from: fromDate,
      to: "2018-12-20",
      period: "d"
      // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
    },
    function(err, quotes) {
      if(err){
        console.log(err) 
        res.status(500).json({
          error:err
        })
      }      
      else    
      res.send(quotes);
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
  console.log(date);
  let historyResult = await ProductHistory.findOne({
    symbol: symbol,
    date: date
  });

  let currentAmount =
    parseFloat(historyResult.price) * parseFloat(historyResult[localCurrency]);
  // console.log("Current Amount", currentAmount);
  return currentAmount;
}

module.exports = router;
