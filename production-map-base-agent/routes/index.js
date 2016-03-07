var express = require('express');
var router = express.Router();
var moduleLoader = require('../utils/jsloader.js');
var request = require('request');
var multer = require('multer');
var fs = require('os');
var unzip = require('unzip');
var path_module = require('path');

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

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});

var upload = multer({ //multer settings
    storage: storage
}).single('file');

/** API path that will upload the files */
router.post('/registerAgent', function(req, res) {
    upload(req,res,function(err, filename){
        if(err){
            res.json({ersror_code:1,err_desc:err});
            return;
        }
        console.log(filename);
        fs.createReadStream('./uploads/' + filename)
            .pipe(unzip.Parse())
            .on('entry', function (entry) {
                var fileName = entry.path;
                var type = entry.type; // 'Directory' or 'File'
                var size = entry.size;
                if (fileName !== "config.json") {
                    entry.pipe(fs.createWriteStream('./libs/' + filename));
                } else {
                    entry.autodrain();
                }
            }).then(function(err){
            	var DIR = path_module.join(__dirname, 'libs', filename);
				console.log('Loading modules...');
				LoadModules(DIR); // Load initial modules
				setTimeout(function () {
				  console.log('Loaded modules');
				  console.log(JSON.stringify(module_holder));
				}, 2000);
        		res.json({error_code:0,err_desc:null});
            });
    })

});

module.exports = router;
