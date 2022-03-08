const { connect } = require("amqp-connection-manager");

const logger = require("./logger");

class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";

    connection = {};
    channel = {};
    consumerTag = {};
    opts = {};
    queue = [];

    constructor() { }

    configure(opts) {
        this.opts = {
            ...opts
        };
    }

    async connectToAMQP(vhost) {
        const connection = connect(
            `amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`,
            { connectionOptions: this.opts }
        );

        connection.on('disconnect',({err})=>{
            console.error(`Connection Failed: ${err}`);
        })

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
                    setup: async channel => {
                        if (channel) {
                            logger.info(`Rabbit successfully connected to vhost: "${vhost}"`);
                            this.channel[vhost] = channel;

                            if (setup) {
                                await setup();
                            }
                            for (const item of this.queue) {
                                await this.sendToQueue.apply(this, item);
                            }
                            this.queue = [];

                            resolve(connection);
                        }

                        reject();
                    }
                });
            });
        } else {
            throw new Error("Could not connect to AMQP queue!");
        }
    }

    async checkIfQueueExists(queue, vhost) {
        /**
         * If the queue does not exists, the exception will be thrown.
         * There is no way to catch that exception as it's part of the protocol:
         * https://stackoverflow.com/questions/39088376/amqplib-how-to-safely-check-if-a-queue-exists
         * This will also cause the connection to close, initiating the reconnection:
         * https://www.squaremobius.net/amqp.node/channel_api.html#channel_checkQueue
         */
        return this.channel[vhost].checkQueue(queue);
    }

    async connectAndInit(vhost, initFunction) {
        const connection = await this.amqpConnect(vhost, initFunction);
        connection.on("close", () => {
            logger.error(`Lost AMQP connection with vhost: "${vhost}". Trying to reconnect in a while.`);
        });
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
        try {
            const result = await this.channel[vhost].sendToQueue(queue, message, opts);
            return result;
        } catch (error) {
            logger.error(`Could not send message. Origin error: ${error.message}. Retrying when reconnected.`);
            this.queue.push([queue, vhost, message, opts]);
            throw error;
        }
    }

    async consumeQueue(queue, vhost, cb) {
        const exists = await this.checkIfQueueExists(queue, vhost);
        if (exists) {
            this.consumerTag[vhost + queue] = await this.channel[vhost].consume(queue, async (msg)=>{
                if(msg == null){
                    logger.error(`Recieved null message, channel closed. Trying to reconnect`);
                    this.consumeQueue(queue, vhost,cb);
                    return;
                }
                cb(msg);
            }, {noAck: true});
            return this.consumerTag[vhost + queue];
        }
    }

};

module.exports = new AmqpService();
