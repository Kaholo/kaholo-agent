var express = require('express');
var router = express.Router();
var moduleLoader = require('../utils/jsloader.js');
var request = require('request');
var multer = require('multer');
var fs = require('fs');
var unzip = require('unzip');
var path_module = require('path');
var exec = require('child_process').exec;

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

router.use(multer({ dest: './uploads/'}).single('file'));

/** API path that will upload the files */
router.post('/registeragent', function(req, res) {
	console.log(req.file);
	var filename = req.file.originalname.split('.')[0];
	if (!fs.existsSync('./libs/' + filename)){
	    fs.mkdirSync('./libs/' + filename);
	}
	fs.createReadStream(req.file.path)
	    .pipe(unzip.Parse())
	    .on('entry', function (entry) {
	        var fileName = entry.path;
	        var type = entry.type; // 'Directory' or 'File'
	        var size = entry.size;
	        if(fileName !== "config.json"){
	        	entry.pipe(fs.createWriteStream('./libs/' + filename + "/" + fileName));
	        }
	        else {
	            entry.autodrain();
	        }
	    }).on('close', function(data){
	    	console.log('end data');
	    	var cmd = 'npm install';
				exec(cmd, function(error, stdout, stderr) {
				  console.log(stdout);
				  console.log(stderr);
				  console.log(error);
				  moduleLoader.loadModules('./libs/' + filename ).then(function(err){
							console.log(err);
		    				console.log("ASdfasdfasdf");
		    				res.json({error_code:0,err_desc:null});
					}); // Load initial modules
				});
	    });

});

module.exports = router;