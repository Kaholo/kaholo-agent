var exec = require('child_process').exec;
var q = require('q');
var async = require('async');

function executeCMD(action){
	var deferred = q.defer();
	console.log("Got Task dedicated agent");
	console.log(action);
	var execString = action.method.actionString;
	console.log(JSON.stringify(action.method.params));
	for (var i =0; i< action.method.params.length;i++){
		var param = action.method.params[i].name;
		if (action.params.hasOwnProperty(param)) {
			execString = execString.replace(param, action.params[param]);
		}
		else{
			execString = execString.replace(param, '');
		}
	}
	console.log(execString);
	exec(execString,
		 function(error, stdout, stderr){
		 	console.log('--- cli output ---');
		 	console.log(stdout);
		 	console.log('--- cli output ---');
		 	console.log('--- error output ---');
		 	console.log(error)
		 	console.log('--- error output ---');
		 	console.log('--- stderr output ---');
		 	console.log(stderr)
		 	console.log('--- stderr output ---');
			if(error){
				return deferred.resolve({"error": stderr});
			}
			return deferred.resolve({"res": stdout});
		 }
	);
	return deferred.promise;
}

exports.execute = executeCMD;

exports.executeFile = executeCMD;

exports.remoteCommandExecute = executeCMD;

exports.executeMultiple = function(action) {
	var deffered = q.defer();
	var command = action.params.command;
	var paramsList = JSON.parse(action.params.paramsList);
	console.log("Starting execution");
	async.map(paramsList, function(params, callback) {
		var execString = command + " ";
		for (var i = 0; i < params.length; i++) {
			execString += params[i] + " ";
		}
		exec(execString,
			 function(error, stdout, stderr){
			 	console.log('--- cli output ---');
			 	console.log(stdout);
			 	console.log('--- cli output ---');
			 	console.log('--- error output ---');
			 	console.log(error)
			 	console.log('--- error output ---');
			 	console.log('--- stderr output ---');
			 	console.log(stderr)
			 	console.log('--- stderr output ---');
				if(error){
					return callback(null, {"error": stderr});
				}
				return callback(null, {"res": stdout});
			 }
		);
	}, function(err, results){
		if(err){
			return deffered.resolve({"error": err});
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

exports.name = "CommandLine";
