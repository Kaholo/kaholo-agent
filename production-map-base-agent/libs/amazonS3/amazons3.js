var CREATE_BUCKET = "create bucket";
var UPLOAD_FILE = "upload file";
var AWS = require('aws-sdk');
var q = require('q');

var createBucket = function(accessKey, secretKey, region, bucketName, success, fail){
	console.log("creating bucket");
	AWS.config.region = region;
	AWS.config.update({accessKeyId: accessKey, secretAccessKey: secretKey});
	var s3bucket = new AWS.S3({params: {Bucket: bucketName}});
	s3bucket.createBucket(function(err) {
		if(err){
			return fail(err);
		}
		else{
			return success("Created Bucket successfully " + bucketName);
		}
	});
}

var uploadFile = function(accessKey, secretKey, region, bucketName, filePath, fileName, success, fail){
	console.log("creating bucket");
	AWS.config.region = region;
	var s3 = new AWS.S3({accessKeyId: accessKey, secretAccessKey: secretKey});
	var fs = require('fs');  // file system
	var rstream = fs.createReadStream(filePath);
	var params = {Bucket: bucketName, Key: fileName, Body: rstream};
	var options = {partSize: 10 * 1024 * 1024, queueSize: 1}; /* 10M part size*/
	s3.upload(params, options, function(err, data) {
	  if(err){
	  	console.log(err);
	  	return fail(err);
	  }
	  else{
	  	console.log("Uploaded File");
	  	var resString = "Uploaded " + fileName + " to bucket " + bucketName;
	  	return success(resString);
	  }
	});
}

module.exports = {
  /**
   * `TaskController.register()`
   */
  name: "AmazonS3",

  createBucket: function (action) {
  	var deffered = q.defer();
	console.log("creating bucket");
	createBucket(action.params.accessKey, action.params.secretKey, action.params.region, action.params.name, function(val){
		return deffered.resolve({"res": val+''});
	},function(err){
		return deffered.resolve({"error": err+''});
	});
	return deffered.promise;
  },
  uploadFile: function (action) {
  	console.log("Uploading File");
	uploadFile(action.params.accessKey, action.params.secretKey, action.params.region, action.params.bucketName, action.params.filePath, action.params.fileName, function(val){
		return deffered.resolve({"res": val+''});
	},function(err){
		return deffered.resolve({"error": err+''});
	});
	return deffered.promise;
  }
};

