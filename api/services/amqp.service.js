const { connect } = require("amqplib");
const fs = require("fs");

class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";

    connection = {};
    channel = {};
    consumerTag = {};

    opts = {
        rejectUnauthorized: false,
        cert: fs.readFileSync("./config/certs/client_certificate.pem"),
        key: fs.readFileSync("./config/certs/client_key.pem")
    };

    constructor() {}
    
    async connectToAMQP(vhost) {
        const connection = await connect(
            `amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`,
            this.opts
        );
        if (connection) {
            this.connection[vhost] = connection;
        }
        return connection;
    }

    async createChannel(vhost) {
        const channel = await this.connection[vhost].createChannel();
        if (channel) {
            this.channel[vhost] = channel;
        }
        return channel;
    }

    async amqpConnect(vhost) {
        const connection = await this.connectToAMQP(vhost);
        if (connection) {
            const channel = await this.createChannel(vhost);
            if (channel) {
                return channel;
            }
            throw new Error("Could not create AMQP channel!");
        } else {
            throw new Error("Could not connect to AMQP queue!");
        }
    }

    async checkIfQueueExists(queue, vhost) {
        return this.channel[vhost].checkQueue(queue);
    }

    async connectToActions() {
        return this.amqpConnect(this.VHOST_ACTIONS);
    }

    async connectToResults() {
        return this.amqpConnect(this.VHOST_RESULTS);
    }

    async unsubscribe(vhost, queue) {
        if (!this.consumerTag[vhost + queue]) {
            throw new Error("Cannot unsubscribe from queue with undefined consumer");
        }
        return this.channel[vhost].cancel(this.consumerTag[vhost + queue]);
    }

    async sendToQueue(queue, vhost, message, opts = {}) {
        return this.channel[vhost].sendToQueue(queue, message, opts);
    }

    async consumeQueue(queue, vhost, cb, opts = []) {
        const exists = await this.checkIfQueueExists(queue, vhost);
        if (exists) {
            this.consumerTag[vhost + queue] = await this.channel[vhost].consumeQueue(queue, cb, opts);
            return this.consumerTag[vhost + queue];
        }
        throw new Error(`Agent queue ${queue} does not exist!`);
    }

};

module.exports = new AmqpService();
