var q = require('q');
var request = require('superagent');

exports.login = function(username, password, server) {
	var deferred = q.defer();
	var agent = request.agent();
	agent
	.post(server + "/auth/local")
	.withCredentials()
	.send({identifier: username, password: password})
	.set('Accept', 'application/json')
	.end(function (err, res) {
		if(err){
			deferred.reject(res);
		}
		else{
			deferred.resolve({"agent": agent, "res": res});
		}
	});
	return deferred.promise;
}