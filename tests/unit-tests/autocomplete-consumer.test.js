const initAutocompleteConsumer = require("../../api/consumers/autocomplete.consumer");
const { getFlowConsumeCallback } = require("@kaholo/shared/dist/tests-helpers/unit");
const processAutocompleteRequest = require("../../api/workers/autocomplete.worker");

jest.mock("@kaholo/shared", () => {
    const vhost = {
        RESULTS: "results",
        ACTIONS: "actions",
        EVENTS: "events",
    }

    return {
        flowConsumer: jest.fn(),
        VHOST: vhost
    }
});

jest.mock("../../api/workers/autocomplete.worker", () => jest.fn());

const options = {
    publish: jest.fn(),
};

describe("Autocomplete Consumer tests", () => {
    beforeEach(initAutocompleteConsumer);
    afterEach(() => {
        // Clean up to isolate each test case
        processAutocompleteRequest.mockClear();
    });

    it("Twiddlebug/Autocomplete/Function/{agentKey}", async () => {
        const callbackData = {
            requestId: "requestId",
            pluginName: "pluginName",
            functionName: "fuctionName",
            query: "query",
            pluginSettings: "pluginSettings",
            actionParams: "actionParams",
        }
        const autocompleteCallback = await getFlowConsumeCallback("Twiddlebug/Autocomplete/Function/{agentKey}");
        expect(autocompleteCallback).toBeDefined();

        await autocompleteCallback(callbackData, options);

        expect(processAutocompleteRequest).toBeCalledTimes(1);
        expect(processAutocompleteRequest).toBeCalledWith(callbackData, { publish: options.publish });
    });
})
