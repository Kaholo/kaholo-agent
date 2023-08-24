const fs = require("fs");
const extract = require('extract-zip');

module.exports.extract = async function (zipPath, extractionPath) {
    return extract(zipPath, {dir: extractionPath});
}
