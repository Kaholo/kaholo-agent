var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var request = require('superagent');
var os = require("os");
var ip = require('ip');
var path = require('path');
var publicIp = require('public-ip');
var q = require('q');

var configurationData = require(path.join(__dirname, "/../conf/baseagent.js"));
var KEYSDIR = path.join(__dirname, "../keys");
var KEYDIR = path.join(__dirname, "../keys/key.pm");
var port = 3000;
var ipaddr = ip.address();
var baseUrl = "http://" + ipaddr + ":" + port;

var getIP = require('external-ip')();

var configData;



function sendKeyToServer(userKey, server, baseUrl){
	console.log("Registering agent at the server");
	var agent = request.agent();
	getConfigData().then(function(data) {
		console.log(data);
		agent
		.post(server + "/BaseAgent/addAgent")
		.withCredentials()
		.send({name: os.hostname().replace(".", "") + '-' + process.platform.replace(".", "") , url: baseUrl, key: userKey})
		.set('Accept', 'application/json, text/plain, */*')
		.set('Content-Type', 'application/json;charset=UTF-8')
		.end(function (err, res) {
			if(err){
				if(!res){
					console.log(err);
				}
				else{
					console.log(err + " (" + res.status + ")\n" + res.error);
				}
				exit(); /* close proggram when failed connecting to the server */
			}
			else{
				console.log("Baseagent installed successfuly.");
			}
		});
	});
}

function randomValueHex (len) {
	return crypto.randomBytes(Math.ceil(len/2))
		.toString('hex') // convert to hexadecimal format
		.slice(0,len);   // return required number of characters
}

exports.registerAgent = function(cb) {
	var keyValue = randomValueHex(128);

	mkdirp(KEYSDIR, function(err) {
		if(err){
			console.log(err);
		}
		fs.writeFile(KEYDIR, keyValue, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("Key was written to `keys/key.pm`");
			sendKeyToServer(keyValue, configData.serverUrl, baseUrl);
			cb(keyValue);
		});
	});
};

exports.updateAgent = function(key) {
	var configData = configurationData;
	sendKeyToServer(key, configData.serverUrl, baseUrl);
};

exports.registerCLI = function() {
	if(process.argv.length < 3){
		console.log("Not enough parameters try:");
		return;
	}

	var keyValue = randomValueHex(128);

	mkdirp(KEYSDIR, function(err) {
		if(err){
			console.log(err);
		}
		fs.writeFile(KEYDIR, keyValue, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log("Key was written to `keys/key.pm`");
			sendKeyToServer(process.argv[2], process.argv[3], keyValue, process.argv[4], baseUrl);
		});
	});
};

exports.setPort = function(sport) {
	port = sport;
	baseUrl = "http://" + ipaddr + ":"+sport;
};

function getConfigData() {
	var deferred = q.defer();
	configData = configurationData;

	if (configData.baseAgentAddress) {
		ipaddr = configData.baseAgentAddress;
		if (configData.baseAgentPort) {
			port = configData.baseAgentPort;
		}

		baseUrl = "http://" + ipaddr + ":" + port;

		return deferred.resolve(configData);
	} else {
		getIP(function (err, externalIp) {
			if (err) {
				ipaddr = ip.address(); // local ip
			} else {
				ipaddr = externalIp; // external ip
			}

			if (configData.baseAgentPort) {
				port = configData.baseAgentPort;
			}

			baseUrl = "http://" + ipaddr + ":" + port;

			return deferred.resolve(configData);
		});
	}
	return deferred.promise;
}

exports.getConfigData = getConfigData;