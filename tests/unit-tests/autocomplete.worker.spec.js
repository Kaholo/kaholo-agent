const pluginsService = require("../../api/services/plugins.service");
const autocompleteWorker = require("../../api/workers/autocomplete.worker");

jest.mock("../../api/services/plugins.service", () => ({
    getAutocompleteFromFunction: jest.fn(),
}))

jest.mock("../../api/services/logger", () => ({
    info: jest.fn(),
}))

describe("Autocomplete Worker tests", () => {
    const requestData = {
        actionParams: [],
        pluginSettings: [],
        pluginName: "pluginName",
        functionName: "functionName",
        query: "query"
    }
    beforeAll(() => {
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    beforeEach(async () => {
        pluginsService.getAutocompleteFromFunction.mockClear();
    });

    it("Should return autocomplete data", async () => {
        const autocompleteResult = [{ param1: "value1" }, { param2: "value2" }]
        pluginsService.getAutocompleteFromFunction.mockReturnValueOnce(autocompleteResult);
        const result = await autocompleteWorker({
            requestData
        });

        expect(pluginsService.getAutocompleteFromFunction).toBeCalledTimes(1);
        expect(pluginsService.getAutocompleteFromFunction).toBeCalledWith(
            requestData.pluginName,
            requestData.functionName,
            requestData.query,
            requestData.actionParams,
            requestData.pluginSettings
        );
        expect(result).toEqual({
            ok: true,
            responseData: {
                autocompleteResult
            },
        });
    });

    it("Should return an object containing an error which is indicating that call for an autocomplete data had issues", async () => {
        pluginsService.getAutocompleteFromFunction.mockImplementation(() => {
            throw new Error("some error");
        });
        const result = await autocompleteWorker({
            requestData
        });

        expect(result).toEqual({
            ok: false,
            responseData: {
                error: "some error"
            },
        });
    });
});
