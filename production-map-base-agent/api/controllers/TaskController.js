/**
 * TaskController
 *
 * @description :: Server-side logic for managing tasks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request');
var DEDICATED_AGENT_URL_CLI = "http://localhost:8100/task/register";
var DEDICATED_AGENT_URL_FTP = "http://localhost:8100/task/registerFtp";
module.exports = {
	register: function (req, res) {
		var execution_result = {msg: "registered task!"};
		var operation = req.body;
		console.log("Got Task");
		console.log(operation);
		request.post(
		    DEDICATED_AGENT_URL_CLI,
		    { form: operation },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            return res.send(body);
		        }
		    }
		);
	},
	registerFtp: function(req, res){
		var execution_result = {msg: "registered task!"};
		var operation = req.body;
		console.log("Got Task");
		console.log(operation);
		request.post(
		    DEDICATED_AGENT_URL_FTP,
		    { form: operation },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            return res.send(body);
		        }
		    }
		);
	}
};

