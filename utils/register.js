const winston = require("winston");
const request = require("superagent");

module.exports.registerAgent = function() {
    let agent = request.agent();
    return new Promise((resolve, reject) => {

        agent
            .post(`${process.env.SERVER_URL}/api/agents/add`)
            .withCredentials()
            .send({
                name: process.env.AGENT_NAME,
                attributes: process.env.TAGS ? process.env.TAGS.split(',') : [],
                url: `http://${process.env.PRIVATE_IP}:${process.env.PORT}`,
                publicUrl: `http://${process.env.PUBLIC_IP}:${process.env.PORT}`,
                key: process.env.AGENT_KEY
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
                    console.log("Agent installed successfully.");

                }
                return resolve();
            });
    });
}