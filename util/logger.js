/*
    Kiko / A fully functional Discord bot with many features.
    Copyright (C) 2022 Thaddeus Kuah
*/
const chalk = require('chalk'); // Using chalk v4 as we won't be using ESM anytime soon.
module.exports = {
    info: (message) => {
        console.log(chalk.bold(chalk.cyan(timestamp()) + chalk.magenta(' • INFO  • ')) + message);
    },
    warn: (message) => {
        console.log(chalk.bold(chalk.cyan(timestamp()) + chalk.yellow(' • WARN  • ')) + message);
    },
    error: (message) => {
        console.log(chalk.bold(chalk.cyan(timestamp()) + chalk.yellow(' • ERROR • ')) + message);
    },
    debug: (message) => {
        if (process.env.ENV === 'production') return;
        console.log(chalk.bold(chalk.cyan(timestamp()) + chalk.gray(' • DEBUG • ')) + message);
    }
};
function timestamp () {
    const date = new Date();
    return date.toLocaleString('en-US', {
        hour12: false,
        timeZone: 'Asia/Singapore',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}