module.exports = {
  getCurrentDate: function() {
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

    today = yyyy + "-" + mm + "-" + dd;
    return today;
  },
  // format date to {month-date-year}
  formatDate: function(currentDate) {
    var date = currentDate.getDate();
    var month = currentDate.getMonth();
    var year = currentDate.getFullYear();
    var monthDateYear = month + 1 + "-" + date + "-" + year;
    return monthDateYear;
  },
  getCurrentLaDate: function() {
    // create Date object for current location
    var d = new Date();

    // convert to msec
    // add local time zone offset
    // get UTC time in msec
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;

    // create new Date object for different city
    // using supplied offset
    var nd = new Date(utc + 3600000 * -8.0);

    // return time as a string
    // return "The local time in " + city + " is " + nd.toLocaleString();
    return nd;
  },
  formatDateYYMMDD: function(currentDate) {
    var date = currentDate.getDate();
    var month = currentDate.getMonth();
    var year = currentDate.getFullYear();
    var monthDateYear = year + "-" + month + 1 + "-" + date;
    return monthDateYear;
  }
};

// get current date
