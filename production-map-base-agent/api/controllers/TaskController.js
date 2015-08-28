/**
 * TaskController
 *
 * @description :: Server-side logic for managing tasks
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var request = require('request');
var DEDICATED_AGENT_URL = "http://localhost:8100/task/register";
module.exports = {
	register: function (req, res) {
		var execution_result = {msg: "registered task!"};
		var sysfile = {
			name: req.body.name,
			content: req.body.content
		};
		console.log("Got Task");
		console.log(sysfile);
		request.post(
		    DEDICATED_AGENT_URL,
		    { form: sysfile },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            return res.json(response);
		        }
		    }
		);
	}
};

