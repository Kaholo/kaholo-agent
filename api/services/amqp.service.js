const { connect } = require("amqp-connection-manager");

const logger = require("./logger");

class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";

    connection = {};
    channel = {};
    consumerTag = {};
    opts = {};
    queues = {
        [this.VHOST_ACTIONS]: [],
        [this.VHOST_RESULTS]: [],
    };

    constructor() {}

    configure(opts) {
        this.opts = {
            ...opts,
        };
    }

    async connectToAMQP(vhost) {
        const connection = connect(
            `amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`,
            { connectionOptions: this.opts }
        );

        if (connection) {
            this.connection[vhost] = connection;
        }

        return connection;
    }

    async amqpConnect(vhost, setup) {
        const connection = await this.connectToAMQP(vhost);
        if (connection) {
            return new Promise((resolve, reject) => {
                connection.createChannel({
                    json: true,
                    setup: async (channel) => {
                        if (!channel) reject();

                        logger.info(`Rabbit successfully connected to vhost: "${vhost}"`);
                        this.channel[vhost] = channel;

                        if (setup) {
                            await setup();
                        }
                        for (const item of this.queues[vhost]) {
                            await this.sendToQueue.apply(this, item);
                        }
                        this.queues[vhost] = [];

                        resolve(connection);
                    },
                });
            });
        } else {
            throw new Error("Could not connect to AMQP queue!");
        }
    }

    async connectAndInit(vhost, initFunction) {
        const connection = await this.amqpConnect(vhost, initFunction);
        connection.on("close", () => {
            logger.error(`Lost AMQP connection with vhost: "${vhost}". Trying to reconnect in a while.`);
        });
    }

    async connectToActions(initFunction) {
        await this.connectAndInit(this.VHOST_ACTIONS, initFunction);
    }

    async connectToResults() {
        await this.connectAndInit(this.VHOST_RESULTS);
    }

    async unsubscribe(vhost, queue) {
        if (!this.consumerTag[vhost + queue]) {
            throw new Error("Cannot unsubscribe from queue with undefined consumer");
        }
        return this.channel[vhost].cancel(this.consumerTag[vhost + queue]);
    }

    async sendToQueue(queue, vhost, message, opts = {}) {
        try {
            const result = await this.channel[vhost].sendToQueue(queue, message, opts);
            return result;
        } catch (error) {
            logger.error(`Could not send message. Origin error: ${error.message}. Retrying when reconnected.`);
            this.queues[vhost].push([queue, vhost, message, opts]);
            throw error;
        }
    }

    async consumeQueue(queue, vhost, cb) {
        const channel = this.channel[vhost];
        await channel.assertQueue(queue, { durable: true });

        this.consumerTag[vhost + queue] = await this.channel[vhost].consume(
            queue,
            async (msg) => {
                if (msg == null) {
                    logger.warn(`Recieved null message, channel closed. Reconnecting...`);
                    return this.connection[vhost].reconnect();
                }
                cb(msg);
            },
            { noAck: true }
        );
        return this.consumerTag[vhost + queue];
    }
}

module.exports = new AmqpService();
