var crypto = require('crypto');
var fs = require('fs');
var mkdirp = require('mkdirp');
var auth = require('./auth');
var request = require('superagent');
var os = require("os");

function sendKeyToServer(username, password, userKey, server, baseUrl){
	console.log("Registering agent at the server");
	auth.login(username, password, server).fail(function(res){
			console.log("Authentication Failed User: '" + username+"'");
			return;
		}).then(function(authRes){
			var res = authRes.res;
			var agent = authRes.agent;
       	 	console.log("Authentication success " + res.body.username);
       	 	agent
		       .post(server + "/BaseAgent/addAgent")
		       .withCredentials()
		       .send({name: os.hostname() + '-' + process.platform , url: baseUrl, key: userKey})
		       .set('Accept', 'application/json, text/plain, */*')
		       .set('Content-Type', 'application/json;charset=UTF-8')
		       .end(function (err, res) {
		       	 if(err){
		       	 	if(!res){
			      		console.log(err);
			       	}
		       	 	else{
		       	 		console.log(err + " (" + res.status + ")\n" + res.error);
		       	 	}
		       	 }
		       	 else{
				      	console.log("Baseagent installed successfuly.");
		       	 }
		       });
		});
}

if(process.argv.length < 6){
	console.log("Not enough parameters try:");
	console.log("node register `BASE-URL` `USERNAME` `PASSWORD` `SERVERURL`");
	return;
}

function randomValueHex (len) {
    return crypto.randomBytes(Math.ceil(len/2))
        .toString('hex') // convert to hexadecimal format
        .slice(0,len);   // return required number of characters
}

var keyValue = randomValueHex(128);

mkdirp('../keys', function(err) {
    if(err){
    	console.log(err);
    }
    fs.writeFile("../keys/key.pm", keyValue, function(err) {
	    if(err) {
	        return console.log(err);
	    }
	    console.log("Key was written to `keys/key.pm`");
	    sendKeyToServer(process.argv[3], process.argv[4], keyValue, process.argv[5], process.argv[2]);
	});
});