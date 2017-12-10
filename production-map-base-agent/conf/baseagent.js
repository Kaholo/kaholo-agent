var server = process.env.SERVER_URL || 'localhost';
var port = process.env.SERVER_PORT || 8080;


module.exports = {
    "serverUrl": server + ":" + port
};
