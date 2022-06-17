const prettyms = require('pretty-ms');
module.exports = {
    formatTime: (ms) => {
        return prettyms(ms, { colonNotation: true, millisecondsDecimalDigits: 0, secondsDecimalDigits: 0 });
    }
};