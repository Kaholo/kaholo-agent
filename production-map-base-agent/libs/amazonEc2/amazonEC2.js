var CREATE_VM = "create instance";
var AWS = require('aws-sdk');

var createVM = function(accessKey, secretKey, region, imageId, instanceType, minCount, maxCount, keyPair, success, fail){
	sails.log("creating VM");
	AWS.config.update({accessKeyId: accessKey, secretAccessKey: secretKey});
	var ec2 = new AWS.EC2({region: region});
    var params = {
	  ImageId: imageId,
	  InstanceType: instanceType,
	  MinCount: minCount, MaxCount: maxCount,
    KeyName: keyPair
	};

	sails.log("start running instance");
	// Create the instance
	ec2.runInstances(params, function(err, data) {
	  if (err) { sails.log.error("Could not create instance " + err); return fail(err);}

	  var instanceId = data.Instances[0].InstanceId;
	  sails.log.info("Created instance " + instanceId);
	  return success(instanceId);
	});
}

exports.createInstance = function (action) {
    var deferred = q.defer();
    console.log("Loding vm from user");
    createVM(action.params.accessKey, action.params.secretKey, action.params.region, action.params.imageId, action.params.instanceType, action.params.minCount, action.params.maxCount, action.params.keyPair, function(val){
      return deferred.resolve({"res": val+''});
    },function(err){
      return deferred.resolve({"error": err+''});
    });
    return deferred.promise;
}