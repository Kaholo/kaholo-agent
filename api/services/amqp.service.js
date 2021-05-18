const { connect } = require("amqplib");

const logger = require("./logger");

class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";

    connection = {};
    channel = {};
    consumerTag = {};
    opts = {};

    constructor() {}

    configure(opts) {
        this.opts = {
            ...opts
        };
    }
    
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
                logger.info(`Rabbit successfully connected to vhost: "${vhost}"`);
                return connection;
            }
            throw new Error("Could not create AMQP channel!");
        } else {
            throw new Error("Could not connect to AMQP queue!");
        }
    }

    async checkIfQueueExists(queue, vhost) {
        return this.channel[vhost].checkQueue(queue);
    }

    async connectAndInit(vhost, initFunction) {
        const connection = await this.amqpConnect(vhost);
        if (initFunction) {
            try {
                await initFunction();
            } catch(error) {
                logger.error("Error during initialization of AMQP", error);
                await connection.close();
                throw error;
            }
        }
        connection.on("close", () => {
            logger.error(`Lost AMQP connection with vhost: "${vhost}". Trying to reconnect in a while.`);
            this.amqpReconnect(vhost, initFunction);
        });
    }

    amqpReconnect(vhost, initFunction) {
        setTimeout(async () => {
            try {
                await this.connectAndInit(vhost, initFunction)
            } catch (error) {
                logger.error(`Error during AMQP reconnect attempt with vhost: "${vhost}". Trying to reconnect in a while.`, error);
                this.amqpReconnect(vhost, initFunction);
            }
        }, 10000);
    }

    async connectToActions(initFunction) {
        await this.connectAndInit(this.VHOST_ACTIONS, initFunction)
    }

    async connectToResults() {
        await this.connectAndInit(this.VHOST_RESULTS)
    }

    async unsubscribe(vhost, queue) {
        if (!this.consumerTag[vhost + queue]) {
            throw new Error("Cannot unsubscribe from queue with undefined consumer");
        }
        return this.channel[vhost].cancel(this.consumerTag[vhost + queue]);
    }

    async sendToQueue(queue, vhost, message, opts = {}) {
        const connection = this.connection[vhost];
        const parsedMsg = JSON.parse(message.toString());
        const confirmChannel = await connection.createConfirmChannel();
        return new Promise((resolve, reject) => {
            confirmChannel.sendToQueue(queue, message, opts, function (err, ok) {
                if (err !== null) {
                    console.error(
                        `Message failed to queue, queue '${queue}', vhost '${queue}', runId '${parsedMsg.runId}', actionExecutionId '${parsedMsg.actionExecutionId}': ${err}`
                    );
                    // this is temporary to imitate current behavior
                    return resolve();
                }
                console.info(
                    `Message queued, queue '${queue}', vhost '${queue}', runId '${parsedMsg.runId}', actionExecutionId '${parsedMsg.actionExecutionId}'`
                );
                resolve(ok);
            });
        });
    
        // return this.channel[vhost].sendToQueue(queue, message, opts);
    }

    async acknowledge(msg, vhost, cb) {
        await this.channel[vhost].ack(msg);
        cb(msg);
    }

    async consumeQueue(queue, vhost, cb, opts = []) {
        const exists = await this.checkIfQueueExists(queue, vhost);
        if (exists) {
            this.consumerTag[vhost + queue] = await this.channel[vhost].consume(queue, (msg) => this.acknowledge(msg, vhost, cb), opts);
            return this.consumerTag[vhost + queue];
        }
        throw new Error(`Agent queue ${queue} does not exist!`);
    }

};

module.exports = new AmqpService();