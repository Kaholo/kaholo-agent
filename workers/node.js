function main(argv) {
  if (argv.length < 4) {
    console.log('{error: "not enough parameters"}');
    // Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
    process.exit(9);
  }

  let modulepath = argv[2];

  try {
    let functions = require(modulepath);
    let params = JSON.parse(argv[3]);
    functions[params.action.method.name](params.action, params.settings)
      .then(function (res) {
        if (res instanceof Set) res = Array.from(res);

        console.log(JSON.stringify(res));
        exit(0); // Success
      })
      .catch(_handleError);
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
  console.log("Error : ", error);
  // Uncaught Fatal Exception - There was an uncaught exception, and it was not handled by a domain or an 'uncaughtException' event handler.
  exit(1);
}

main(process.argv);
