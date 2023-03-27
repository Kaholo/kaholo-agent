const fs = require("fs");
const unzip = require('unzipper');

module.exports.extract = async function (zipPath, extractionPath) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipPath)
            .pipe(unzip.Extract({ path: extractionPath }))
            .on('error', reject)
            .on('close', resolve);
    })
}
