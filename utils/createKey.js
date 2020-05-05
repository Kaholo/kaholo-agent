const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

function randomValueHex(len) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex') // convert to hexadecimal format
        .slice(0, len);   // return required number of characters
}

module.exports = {

    /* generates pm file to the path specific*/
    generateKey: (outputPath) => {
        console.log(outputPath);
        const keyValue = randomValueHex(128);
        mkdirp.sync(path.dirname(outputPath));
        fs.writeFileSync(outputPath, keyValue);
        return true;
    }
};