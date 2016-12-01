var exec = require('child_process').exec;
var q = require('q');
var async = require('async');

function executeCMD(action){
	var deferred = q.defer();
	var execString = action.method.actionString;
	for (var i =0; i< action.method.params.length;i++){
		var param = action.method.params[i].name;
		if (action.params.hasOwnProperty(param)) {
			execString = execString.replace(param, action.params[param]);
		}
		else{
			execString = execString.replace(param, '');
		}
	}
	exec(execString,
		 function(error, stdout, stderr){
			if(error){
				return deferred.resolve(stderr);
			}
			return deferred.resolve(stdout);
		 }
	);
	return deferred.promise;
}

function executeMultiple(action) {
	var deffered = q.defer();
	var command = action.params.command;
	var paramsList = JSON.parse(action.params.paramsList.value);
	async.map(paramsList, function(params, callback) {
		var execString = command + " ";
		for (var i = 0; i < params.length; i++) {
			execString += params[i] + " ";
		}
		exec(execString,
			 function(error, stdout, stderr){
				if(error){
					return callback(null, stderr);
				}
				return callback(null, stdout);
			 }
		);
	}, function(err, results){
		if(err){
			return deffered.resolve(err);
		}
		var res = "Results:\n";
		for (var i = 0; i < results.length; i++) {
			var cres = results[i];
			res += i + ":";
			if(cres.error){
				res += cres.error;
			}
			else{
				res += cres.res;
			}
		}

		return deffered.resolve({"res": res});
	});
	return deffered.promise;
}

var functions = {
	execute: executeCMD,
	executeFile: executeCMD,
	remoteCommandExecute: executeCMD,
	executeMultiple: executeMultiple
};

function main(argv) {
	if (argv.length < 3) {
		console.log('{err: "not enough parameters"}');
		process.exit(-1);
	}
	var action = JSON.parse(argv[2]);
	functions[action.method.name](action).then(function(res) {
		console.log(res);
		process.exit(0);
	});
}

main(process.argv);