var express = require('express');
var router = express.Router();
var moduleLoader = require('../utils/jsloader.js');
var request = require('request');

/* GET home page. */
router.post('/task/register', function(req, res, next) {
	var execution_result = {msg: "registered task!"};
	var action = req.body;
	console.log("Got Task");
	console.log(action);
	console.log('action server --- > ' + action.server);
	console.log('action method --- > ' + action.method);
	console.log('action type --- > ' + action.server.type);
	console.log('action name --- > ' + action.method.name);
	if(!action.server.url) {
		moduleLoader.runModuleFunction(action.server.type, action.method.name, action).then(
			function(result){
				if(result.hasOwnProperty('error')) {
					res.status(500);
				    return res.send(JSON.stringify(result));
				}
				else {
					res.status(200);
					return res.send(JSON.stringify(result));
				}
			});
	}
	else {
		var DEDICATED_AGENT_URL = action.server.url;

		request.post(
		    DEDICATED_AGENT_URL,
		    { form: action },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            body = JSON.parse(body);
		            if(body.hasOwnProperty("error")){
		            	res.status(500);
		            	console.log("Return with status 500");
		            }
		            console.log(body);
		            return res.send(JSON.stringify(body));
		        }
		        else{
		        	console.log(error);
		        	res.status(500);
		        	return res.send(JSON.stringify({error: error}));
		        }
		    }
		);
	}
});

module.exports = router;
