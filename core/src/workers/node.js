function main(argv) {
    if (argv.length < 4) {
        console.log('{error: "not enough parameters"}');
        // Invalid Argument - Either an unknown option was specified, or an option requiring a value was provided without a value.
        process.exit(9);
    }

    let modulepath = argv[2];

    try{
        let functions = require(modulepath);
        let action = JSON.parse(argv[3]);
        functions[action.method.name](action).then(function (res) {
            console.log(JSON.stringify(res));
            process.exit(0); // Success
        }).catch(_handleError);
    } catch (err){
        _handleError(err);
    }
}

function _handleError(error){
    console.log("Error : ", error);
    // Uncaught Fatal Exception - There was an uncaught exception, and it was not handled by a domain or an 'uncaughtException' event handler.
    process.exit(1);
}

main(process.argv);