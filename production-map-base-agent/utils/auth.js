var q = require('q');
var request = require('superagent');

exports.login = function(server) {
	var deferred = q.defer();
	var agent = request.agent();
	deferred.resolve({"agent": agent});
	return deferred.promise;
}
