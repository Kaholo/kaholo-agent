/**
 * TaskController
 *
 * @description :: Server-side logic for managing tasks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request');
var DEDICATED_AGENT_URL_CLI = "http://localhost:8100/task/register";
var DEDICATED_AGENT_URL_FILESERVER = "http://localhost:8100/task/registerfileserver";
module.exports = {
	register: function (req, res) {
		var execution_result = {msg: "registered task!"};
		var action = req.body;
		console.log("Got Task");
		console.log(action);
		var DEDICATED_AGENT_URL = action.server.url;
		if(action.server.type === "CommandLine"){
			DEDICATED_AGENT_URL = DEDICATED_AGENT_URL_CLI;
		}
		else{
			DEDICATED_AGENT_URL = DEDICATED_AGENT_URL_FILESERVER;
		}
		request.post(
		    DEDICATED_AGENT_URL,
		    { form: action },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            body = JSON.parse(body);
		            if(body.hasOwnProperty("error")){
		            	res.status(500);
		            	sails.log("Return with status 500");
		            }
		            sails.log(body);
		            return res.send(JSON.stringify(body));
		        }
		        else{
		        	sails.log("WTF!!!");
		        	return res.send(JSON.stringify({error: error}));
		        }
		    }
		);
	}
};

