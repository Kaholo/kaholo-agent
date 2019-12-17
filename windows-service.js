var path = require('path');
var Service = require('node-windows').Service;

var appPath = path.join(__dirname, 'core/src/app.js');

// Create a new service object
var svc = new Service({
  name:'Kaholo-Agent',
  description: 'Kaholo-Agent',
  script: appPath
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  setTimeout(()=> {
     svc.start();
  },1000)
});

svc.install();