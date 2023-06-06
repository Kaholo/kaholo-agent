const path = require("path");

module.exports = function (Service) {
  const appPath = path.join(__dirname, "../app.js");

  // Create a new service object
  const svc = new Service({
    name: "Kaholo-Agent",
    description: "Kaholo-Agent",
    script: appPath,
  });

  // Listen for the "install" event, which indicates the
  // process is available as a service.
  svc.on("install", function () {
    console.info("Service installation finished");
    setTimeout(() => {
      console.info("Starting Kaholo-Agent service");
      svc.start();
    }, 1000);
  });

  console.info("Service installation started");
  svc.install();
};
