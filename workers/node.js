const net = require("net");

function main(argv) {
  if (argv.length < 4) {
    console.error('{error: "not enough parameters"}');
    // Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
    process.exit(9);
    return;
  }

  let modulepath = argv[2];

  try {
    let functions = require(modulepath);
    let params = JSON.parse(argv[3]);
    const client = new net.Socket();

    const sendResult = (res) => {
      return new Promise((resolve,reject)=>{
        if (res instanceof Set) res = Array.from(res);
        else if (res instanceof Error) res = res.toString();

        client.write(typeof res === "object" ? JSON.stringify(res) : res?.toString(), (err) => {
          if(err) return reject(err);
          resolve();
        });
      })
    }

    client.connect(process.env.RESULT_PORT, "127.0.0.1", function () {
      functions[params.action.method.name](params.action, params.settings)
        // Send success result and exit
        .then(function (res) {
          return sendResult(res).then(()=>exit(0));
        })
        // Send error result, and handle error
        .catch(err=>{
          return sendResult(err).then(()=>_handleError(err))
        })
        // Handle Send Result error 
        .catch(sendErr=>_handleError(sendErr));
    });
  } catch (err) {
    _handleError(err);
  }
}

/**
 * In order to prevent STDs from close before all data written
 * @param {number} code exit code
 */
function exit(code) {
  code = code || 0;
  // Safe exits process after all streams are drained.
  // file descriptor flag.
  var fds = 0;
  // exits process when stdout (1) and sdterr(2) are both drained.
  function tryToExit() {
    if (fds & 1 && fds & 2) {
      process.exit(code);
    }
  }

  [process.stdout, process.stderr].forEach(function (std) {
    var fd = std.fd;
    if (!std.bufferSize) {
      // bufferSize equals 0 means current stream is drained.
      fds = fds | fd;
    } else if (std.write) {
      // Appends nothing to the std queue, but will trigger `tryToExit` event on `drain`.
      std.write("", function () {
        fds = fds | fd;
        tryToExit();
      });
    }
    // Does not write anything more.
    delete std.write;
  });
  tryToExit();
}

function _handleError(error) {
  switch (error?.code) {
    case "MODULE_NOT_FOUND":
      exit(100);
  }
  exit(1);
  // Uncaught Fatal Exception - There was an uncaught exception, and it was not handled by a domain or an 'uncaughtException' event handler.
}

main(process.argv);
