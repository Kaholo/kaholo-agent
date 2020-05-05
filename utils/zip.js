const fs = require("fs");
const unzip = require('unzipper');

module.exports.extract = async function(zipPath, extractionPath){
    return new Promise(resolve=>{
        fs.createReadStream(zipPath)
                .pipe(unzip.Extract({ path: extractionPath }))
                .on('finish', function () {
                    resolve();
                })

    })
}