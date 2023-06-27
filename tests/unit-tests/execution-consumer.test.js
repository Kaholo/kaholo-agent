const initExecutionConsumer = require("../../api/consumers/execution");
const { getFlowConsumeCallback } = require("@kaholo/shared/dist/tests-helpers/unit")
const executionsManager = require("../../api/execution-manager");
const { eventsWorker } = require("@kaholo/shared");

jest.mock("@kaholo/shared", () => {
    const vhost = {
        RESULTS: "results",
        ACTIONS: "actions",
        EVENTS: "events",
    }

    const eventsWorkerMock = {
        consume: jest.fn(),
        publish: jest.fn(),
    };

    return {
        eventsWorker: eventsWorkerMock,
        flowConsumer: jest.fn(),
        VHOST: vhost
    }
});

jest.mock("../../api/execution-manager", () => {
    return {
        killAction: jest.fn(),
        execute: jest.fn()
    }
});

const options = {
    publish: jest.fn(),
};

describe("Execution Consumer tests", () => {
    beforeAll(() => {
        jest.spyOn(console, "info").mockImplementation(() => {});
    });
    beforeEach(initExecutionConsumer);
    afterEach(() => {
        // Clean up to isolate each test case
        executionsManager.killAction.mockClear();
        executionsManager.execute.mockClear();
    });

    it("Twiddlebug/Execution/Cancel/{agentKey}", async () => {
        const cancelExecutionCallback = await getFlowConsumeCallback("Twiddlebug/Execution/Cancel/{agentKey}");
        expect(cancelExecutionCallback).toBeDefined();

        await cancelExecutionCallback({
            runId: "someRunId",
        });

        expect(executionsManager.killAction).toBeCalledTimes(1);
        expect(executionsManager.killAction).toBeCalledWith("someRunId");
    });

    it("Twiddlebug/Execution/Start/{agentKey}", async () => {
        executionsManager.execute.mockReturnValue({
            actionExecutionId: "actionExecutionId",
        })
        const agentKeyCallback = await getFlowConsumeCallback("Twiddlebug/Execution/Start/{agentKey}");
        expect(agentKeyCallback).toBeDefined();

        await agentKeyCallback({
            actionExecutionId: "actionExecutionId",
            runId: "runId",
            plugin: {
                name: "pluginName"
            },
            actionMethod: {
                name: "actionMethodName"
            },
            pluginSettings: {
                name: "settingName"
            },
            timeout: "timeout",
            actionId: "actionId",
            params: "params"

        }, options);

        expect(executionsManager.execute).toBeCalledTimes(1);
        expect(executionsManager.execute).toBeCalledWith({
            action: {
                _id: "actionId",
                id: "actionId",
                actionExecutionId: "actionExecutionId",
                method: {
                    name: "actionMethodName"
                },
                params: "params",
                plugin: {
                    name: "pluginName"},
                timeout: "timeout"},
            runId: "runId",
            settings: {
                name: "settingName"
            }
        });
        expect(options.publish).toBeCalledTimes(1);
    });
})
