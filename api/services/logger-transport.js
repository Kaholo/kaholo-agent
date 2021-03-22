const winston = require('winston');
 
const transport = new winston.transports.Console({
  json: false,
  format : winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${level}: ${message}`;
    })
  )
})

module.exports = transport;
