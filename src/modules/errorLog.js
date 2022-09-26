const fs = require('fs');
const util = require('util');
const moment = require('moment');
const shell = require('shelljs');

const event = require('events');
var emitter = new event();
var log_file_err = fs.createWriteStream(__dirname + './../error.log',{flags:'a'});

emitter.on('errorLog', async function (err) {
    console.log('Caught exception: ' + err);
    log_file_err.write(util.format(err.info + ' :: ' + err.code) + ' ' + moment().format('DD-MM-YYYY HH:mm:ss') + '\n');
    shell.exec('pm2 restart all');
});

module.exports.event = {emitter}