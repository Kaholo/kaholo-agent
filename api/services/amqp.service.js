const { connect } = require("amqplib");
const fs = require("fs");

let connection = {}, channel = {}, consumerTag = {};

const opts = {
    rejectUnauthorized: false,
    cert: fs.readFileSync("./config/certs/client_certificate.pem"),
    key: fs.readFileSync("./config/certs/client_key.pem")
};

class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";

    constructor() {}
    
    async #connectToAMQP(vhost) {
        const conn = await connect(`amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`, opts);
        if (conn) {
            connection[vhost] = conn;
        }
        return conn;
    }

    async #createChannel(vhost) {
        const ch = await connection[vhost].createChannel();
        if (ch) {
            channel[vhost] = ch;
        }
        return ch;
    }

    async #amqpConnect(vhost) {
        const conn = await this.#connectToAMQP(vhost);
        if (conn) {
            const ch = await this.#createChannel(vhost);
            if (ch) {
                return ch;
            }
            throw new Error("Could not create AMQP channel!");
        } else {
            throw new Error("Could not connect to AMQP queue!");
        }
    }

    async #checkIfQueueExists(queue, vhost) {
        return channel[vhost].checkQueue(queue);
    }

    async connectToActions() {
        return this.#amqpConnect(VHOST_ACTIONS);
    }

    async connectToResults() {
        return this.#amqpConnect(VHOST_RESULTS);
    }

    async unsubscribe(vhost, queue) {
        if (!consumerTag[vhost + queue]) {
            throw new Error("Cannot unsubscribe from queue with undefined consumer");
        }
        return channel[vhost].cancel(consumerTag[vhost + queue]);
    }

    async sendToQueue(queue, vhost, message, opts = {}) {
        return channel[vhost].sendToQueue(queue, message, opts);
    }

    async consumeQueue(queue, vhost, cb, opts = []) {
        const exists = await this.#checkIfQueueExists(queue, vhost);
        if (exists) {
            consumerTag[vhost + queue] = await channel[vhost].consumeQueue(queue, cb, opts);
            return consumerTag[vhost + queue];
        }
        throw new Error(`Agent queue ${queue} does not exist!`);
    }

};

module.exports = new AmqpService();