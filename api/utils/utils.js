var CronJob = require('cron').CronJob;

module.exports = {
    start: function () {
        console.log("Start cron job")
        new CronJob('00 07 13 * * *', function() {
            console.log('You will see this message at 13:07 LA TimeZone');
          }, null, true, 'America/Los_Angeles');
    },
    stop: function () {
        console.log("Stop cron job")
    }
};