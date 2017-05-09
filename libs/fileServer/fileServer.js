var exec = require('child_process').exec;
var q = require('q');

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

exports.mkdir = executeCMD;

exports.rm = executeCMD;

exports.cp = executeCMD;

exports.mv = executeCMD;

exports.name = "FileServer";