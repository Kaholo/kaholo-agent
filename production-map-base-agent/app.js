var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var winston = require('winston');
var expressWinston = require('express-winston');

var fs = require('fs');
var logsdir = './logs';
var libsdir = './libs';
if (!fs.existsSync(logsdir)) {
    fs.mkdirSync(logsdir);
}

if (!fs.existsSync(libsdir)) {
    fs.mkdirSync(libsdir);
}

var routes = require('./routes/index');

var app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

const tsFormat = () =
>
(new Date()).toLocaleTimeString();

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new (winston.transports.File)({
            filename: path.join(logsdir, `httprequests.log`),
            timestamp: tsFormat,
            level: 'info',
            json: true
        })
    ],
    meta: true, // optional: control whether you want to log the meta data about the request (default to true)
    msg: "HTTP {{req.method}} {{req.url}}", // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
    expressFormat: true, // Use the default Express/morgan request formatting. Enabling this will override any msg if true. Will only output colors with colorize set to true
    colorize: true, // Color the text and status code, using the Express/morgan color palette (text: gray, status: default green, 3XX cyan, 4XX yellow, 5XX red).
    ignoreRoute: function (req, res) { return false; } // optional: allows to skip some log messages based on request and/or response
}));

app.use('/', routes);

app.use(expressWinston.errorLogger({
    transports: [
        new (winston.transports.Console)({
            timestamp: tsFormat,
            colorize: true,
            json: true,
            level: 'error'
        }),
        new (winston.transports.File)({
            filename: path.join(logsdir, 'error.log'),
            timestamp: tsFormat,
            level: 'error',
            json: true
        })
    ]
}));

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        console.log(err.message);
        console.log(err);
        res.send(JSON.stringify({ 'error': err.message }));
    });
}


module.exports = app;
