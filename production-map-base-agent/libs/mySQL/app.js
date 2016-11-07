var q = require('q');
var async = require('async');
var mysql      = require('mysql');

function executeQuery(action){
	var deferred = q.defer();
	var connection = mysql.createConnection({
	host     : action.params.host,
	user     : action.params.user,
	password : action.params.password,
	database : action.params.db
	});
	connection.connect();

	connection.query(action.params.queryString, function(err, rows, fields) {
		if(err){
			return deferred.resolve({"error": err});
		}
		return deferred.resolve({"res": JSON.stringify(rows)});
	});

	connection.end();

	return deferred.promise;
}

exports.executeQuery = executeQuery;

exports.name = "MySQL";