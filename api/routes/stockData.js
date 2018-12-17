const express = require("express");
const router = express.Router();
const yahooFinance = require("yahoo-finance");
const BuySellTransactions = require("../models/buySellTransactions");
const ProductHistory = require("../models/productHistory");

router.post("/statusPortfolio", async (req, res, next) => {
  let logs;
  try {
    logs = await BuySellTransactions.find({ emailId: req.body.email }).sort({
      date: 1
    });
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }
  let sDate, eDate;
  let datesArray = [];
  let productList = [];
  let portfolioSpend, portfolioCurrent, gain;

  if (logs) {
    portfolioSpend = 0;
    
    // iterate the logs
    for (i = 0; i < logs.length; i++) {
      gain = 0;
      // add symbol to object array
      var foundIndex = productList.findIndex(x => x.symbol == logs[i].symbol);

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
      // console.log(productList);

      if (i == 0) {
        sDate = logs[i].date;
        // get current portfolio status
        // function currentDatePortfolio();

        // calculate amount Spend
        if (logs[i].type == "buy") {
          portfolioSpend += parseFloat(logs[i].localCurrencyAmount);
        } else if (logs[i].type == "sell") {
          portfolioSpend -= parseFloat(logs[i].localCurrencyAmount);
        }

        var currentDatePortfolio = 0;
        // console.log(currentDatePortfolio, sDate);       

        for (const element of productList) {
          console.log(element);
          var portfolioHistoryValue =  await getHistory(sDate,logs[i].symbol);
          currentDatePortfolio +=
            parseFloat(element.units) * parseFloat(portfolioHistoryValue);
            console.log("---",currentDatePortfolio)
        }

        console.log(currentDatePortfolio,portfolioSpend);
        gain = currentDatePortfolio - portfolioSpend;

        var datesObj = {
          date: sDate,
          portfolioSpend: portfolioSpend,
          portfolioCurrent: currentDatePortfolio,
          gain: gain
        };
        console.log(datesObj);
      }
    }
  } else {
    res.status(400).json({
      message: "No Portfolio Transactions"
    });
  }
});

router.post("/portfolioStatus", async (req, res, next) => {
  let logs;
  try {
    // fetch BuySellTransactions
    logs = await BuySellTransactions.find({ emailId: req.body.email }).sort({
      date: 1
    });

    if (logs) {
      // // get startDate
      // var startDate = new Date(
      //   new Date().setFullYear(new Date().getFullYear() - 1)
      // );
      // // get endDate
      // var endDate = new Date(getCurrentDate());

      // // generate dates
      // var dateArray = getDates(startDate, endDate);

      // Symbols with units as key pair
      let dict = [];
      let datesArray = [];
      let sDate, eDate;
      let pAmount = 0;
      let currentAmount;

      // iterate transactions
      for (i = 0; i < logs.length; i++) {
        let smbl = logs[i].symbol;
        eDate = formatDate(logs[i].date);
        // add symbol to object array
        var foundIndex = dict.findIndex(x => x.symbol == smbl);

        if (foundIndex >= 0) {
          // console.log(logs[i].type);
          if (logs[i].type == "buy") {
            dict[foundIndex].units += parseFloat(logs[i].units);
          } else if (logs[i].type == "sell") {
            console.log("sell**");
            var units =
              parseFloat(logs[i].units) - parseFloat(dict[foundIndex].units);
            dict[foundIndex].units -= parseFloat(logs[i].units);
          }
          // console.log(dict[foundIndex]);
        } else {
          var dictObject = {
            symbol: smbl,
            units: logs[i].units,
            price: logs[i].basePrice
          };
          // console.log("add to dict", dictObject);
          dict.push(dictObject);
        }

        // set the start date and end date to same if i=0;
        if (i == 0) {
          // define startDate and endDate
          sDate = formatDate(logs[i].date);
        }

        let realTimePrice = 100;
        let exchangeRate;

        if (sDate == eDate) {
          // create the entry
          // add portfolioAmount to the value in existing Date
          pAmount += parseFloat(logs[i].localCurrencyAmount);
          let dateObject = {
            date: eDate,
            portfolioAmount: pAmount,
            currentAmount: currentAmount
          };
          datesArray.push(dateObject);
        } else {
          let dateObject = {
            date: eDate,
            realTimePrice: realTimePrice
          };
          datesArray.push(dateObject);
          sDate = formatDate(logs[i].date);
        }
      }

      res.send(datesArray);
    }
  } catch (err) {
    res.status(500).json({
      error: err
    });
  }
});

router.get("/:symbol", async (req, res, next) => {
  //   yahooFinance.historical(
  //     {
  //       symbol: req.params.symbol,
  //       from: "2018-01-01",
  //       to: "2018-12-11",
  //       period: 'd'
  //       // period: 'd'  // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
  //     },
  //     function(err, quotes) {
  //       res.status(200).json({
  //         quotes: quotes
  //       });
  //     }
  //   );
  console.log(getCurrentDate());

  var endDate = new Date(getCurrentDate());
  console.log(endDate);

  var startDate = new Date(
    new Date().setFullYear(new Date().getFullYear() - 1)
  );

  console.log("startDate", startDate);

  var dates = getDates(startDate, endDate);

  // console.log(dates);

  /*yahooFinance.quote(
    {
      symbol: req.params.symbol,
      modules: ["financialData"] // see the docs for the full list
    },
    function(err, quotes) {
      res.status(200).json({
        quotes: quotes
      });
    }
  );*/
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

async function formatDateYYYYmmDD(date){  
    
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;
    
        return [year, month, day].join('-');
   
}

async function getHistory(startDate, symbol){

  var date = await formatDateYYYYmmDD(startDate);
  let historyResult = await ProductHistory.findOne({symbol:symbol,date:date});
  let currentAmount = parseFloat(historyResult.price) * parseFloat(historyResult.DKK);
  console.log("Current Amount",currentAmount);
  return currentAmount;

}


module.exports = router;
