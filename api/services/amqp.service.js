const { connect } = require("amqplib");
class AmqpService {
    VHOST_RESULTS = "results";
    VHOST_ACTIONS = "actions";
    RECONNECT_INTERVAL=3000

    connection = {};
    channel = {};
    consumers = {};
    opts = {};

    constructor() {}

    configure(opts) {
        this.opts = {
            ...opts,
        };
    }

    async connectToAMQP(vhost, isReconnect) {
        let connection;
        try{
            connection = await connect(
                `amqps://${process.env.AMQP_USER}:${process.env.AMQP_PASSWORD}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${vhost}`,
                this.opts
                );
        } catch (err){
            if (isReconnect){
                console.error(`[AMQP] reconnect failed '${vhost}': ${err}. Retrying...`);
                return this.reconnectQueue(vhost);
            }
        }
        if (!connection)
            return;
        
        connection.on("error", function (err) {
            if (err.message !== "Connection closing") {
                console.error("[AMQP] conn error", err.message);
            }
        });

        connection.on("close", () => {
            console.error(`[AMQP] reconnecting '${vhost}'`);
            return this.reconnectQueue(vhost);
        });

        console.log(`[AMQP] connected '${vhost}'`);
        this.connection[vhost] = connection;
        
        await this.createChannel(vhost)
        this.restoreConsumers(vhost);
        
        return connection;
    }

    async reconnectQueue(vhost){
        setTimeout(() => {
            this.connectToAMQP(vhost, true);
        }, this.RECONNECT_INTERVAL);
    }

    async createChannel(vhost) {
        const channel = await this.connection[vhost].createChannel();
        if (channel) {
            this.channel[vhost] = channel;
        }
        return channel;
    }

    async checkIfQueueExists(queue, vhost) {
        return this.channel[vhost].checkQueue(queue);
    }

    async connectToActions() {
        return this.connectToAMQP(this.VHOST_ACTIONS);
    }

    async connectToResults() {
        return this.connectToAMQP(this.VHOST_RESULTS);
    }

    async unsubscribe(vhost, queue) {
        if (!this.consumers[`${vhost}-${queue}`]) {
            throw new Error("Cannot unsubscribe from queue with undefined consumer");
        }
        return this.channel[vhost].cancel(this.consumers[`${vhost}-${queue}`].consumer);
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

    async restoreConsumers(connectionVhost) {
        for (let consumerKey in this.consumers) {
            const { queue, vhost, cb, opts } = this.consumers[consumerKey];
            if(vhost !== connectionVhost) 
                continue;
            await this.consumeQueue(queue, vhost, cb, opts, true);
        }
    }

    async consumeQueue(queue, vhost, cb, opts = [], isReconnect) {
        let exists;
        try{
            exists = await this.checkIfQueueExists(queue, vhost);
        } catch (err){
            if (isReconnect){
                console.error(`[AMQP] Reconsume failed '${vhost}'-'${queue}': ${err}. Retrying...`);
                return setTimeout(()=>{
                    this.consumeQueue(queue, vhost, cb, opts, true);
                }, this.RECONNECT_INTERVAL   )
            }
        }
        if (exists) {
            console.info(`[AMQP] Consuming '${vhost}'-'${queue}'`);
            const consumerMapObejct = {
                vhost, queue, cb, opts,
                consumer: await this.channel[vhost].consume(
                    queue,
                    (msg) => {
                        this.acknowledge(msg, vhost, cb);
                    },
                    opts
                ),
            };
            this.consumers[`${vhost}-${queue}`] = consumerMapObejct;

            return this.consumers[`${vhost}-${queue}`].consumer;
        }
        throw new Error(`Agent queue ${queue} does not exist!`);
    }
}

module.exports = new AmqpService();
