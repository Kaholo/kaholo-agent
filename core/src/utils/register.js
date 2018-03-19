const os = require("os");
const winston = require("winston");

const request = require("superagent");


function sendKeyToServer(agentKey, serverUrl, privateUrl, publicUrl) {
    let agent = request.agent();
    return new Promise((resolve, reject) => {

    agent
        .post(`${serverUrl}/api/agents/add`)
        .withCredentials()
        .send({
            name: os.hostname().replace(".", "") + '-' + process.platform.replace(".", ""),
            url: privateUrl,
            publicUrl: publicUrl,
            key: agentKey
        })
        .set('Accept', 'application/json, text/plain, */*')
        .set('Content-Type', 'application/json;charset=UTF-8')
        .end(function (err, res) {
            if (err) {
                winston.error(
                    `Failed connecting to server. Possible reasons are:
                    1. Server url is incorrect
                    2. Server is down
                    3. Agent Key is forbidden for use
                        in this case delete the key folder and rerun the application`);
                winston.info("Exiting process");
                /* close program when failed connecting to the server */
                reject();
                process.exit();
            }
            else {
                console.log("Agent installed successfuly.");

            }
            return resolve();
        });
    });
}

module.exports = {
    register: sendKeyToServer
};