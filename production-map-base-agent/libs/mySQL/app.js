var q = require('q');
var async = require('async');
var mysql      = require('mysql');
var fs = require('fs');

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

function executeSQLFile(action){
	var deferred = q.defer();
	var connection = mysql.createConnection({
	host     : action.params.host,
	user     : action.params.user,
	password : action.params.password,
	database : action.params.db,
	multipleStatements: true
	});
	connection.connect();

	fs.readFile(action.params.filePath, 'utf8', function(err, queries) {
		if(err){
			return deferred.resolve({"error": JSON.stringify(err)});
		}

		connection.query(queries, function(err, results) {
			if(err){
				return deferred.resolve({"error": JSON.stringify(err)});
			}
			return deferred.resolve({"res": JSON.stringify(results)});
		});

		connection.end();
	});

	return deferred.promise;
}

exports.executeQuery = executeQuery;

exports.executeSQLFile = executeSQLFile;

exports.name = "MySQL";
