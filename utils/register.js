const logger = require("../api/services/logger");
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
                privateUrl: `http://${process.env.PRIVATE_IP}:${process.env.PORT}`,
                publicUrl: `http://${process.env.PUBLIC_IP}:${process.env.PORT}`,
                key: process.env.AGENT_KEY
            })
            .set('Accept', 'application/json, text/plain, */*')
            .set('Content-Type', 'application/json;charset=UTF-8')
            .end(function (err, res) {
                if (err) {
                    logger.error(
                        `Failed connecting to server. Possible reasons are:
                    1. Server url is incorrect
                    2. Server is down
                    3. Agent Key is forbidden for use
                        in this case please change the AGENT_KEY in kaholo-agent.conf`);
                    
                    logger.error(err);
                    logger.info("Exiting process");
                    /* close program when failed connecting to the server */
                    reject();
                    process.exit();
                }
                else {
                    logger.info("Agent installed successfully.");
                }
                return resolve();
            });
    });
}
