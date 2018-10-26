const cron = require("node-cron");

module.exports = {
    start: function () {
        console.log("Start cron job")
        cron.schedule('* * 1 * * ', () => {
            console.log('running a task every minute');
          });
    },
    stop: function () {
        console.log("Stop cron job")
    }
};