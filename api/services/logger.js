const winston = require('winston');
 
const consoleTransport = require('./logger-transport');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [ 
    consoleTransport
  ],
});

module.exports = logger;