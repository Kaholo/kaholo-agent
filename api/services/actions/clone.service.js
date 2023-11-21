const { execCommand } = require("@kaholo/shared");

async function clone({ params }) {
  const { path, cloneUrl, commitHash } = params;

  const result = await execCommand(
    `mkdir -p ${path} && git clone ${cloneUrl} ${path} && cd ${path} && git config advice.detachedHead false ${
      commitHash ? "&& git checkout ${commitHash}" : ""
    }`
  );
  if (result.code !== 0) {
    console.error(result.stderr);
    throw new Error(result.stderr);
  }
  console.log(`Cloned repository to ${path} and checked out commit ${commitHash}`);
  return "Success";
}

function getCloneExecutionData(executionRequest) {
  return {
    pipelineExecutionId: executionRequest.pipelineExecutionId,
    runId: executionRequest.runId,
    settings: {},
    methods: [
      {
        name: "clone",
        viewName: "clone",
        params: [
          {
            name: "path",
            type: "string",
            viewName: "clonePath",
          },
          {
            name: "pipelineId",
            type: "string",
            viewName: "pipelineId",
          },
          {
            name: "cloneUrl",
            type: "string",
            viewName: "cloneUrl",
          },
          {
            name: "commitHash",
            type: "string",
            viewName: "commitHash",
          },
        ],
      },
    ],
    action: {
      internal: {
        path: "/twiddlebug/api/services/actions/clone.service.js",
      },
      timeout: executionRequest.timeout,
      _id: executionRequest.actionId,
      id: executionRequest.actionId,
      method: {
        name: "clone",
      },
      params: {
        path: executionRequest.params ? executionRequest.params.path : null,
        cloneUrl: executionRequest.params
          ? executionRequest.params.cloneUrl
          : null,
        commitHash: executionRequest.params
          ? executionRequest.params.commitHash
          : null,
        pipelineId: executionRequest.pipelineId,
      },
      actionExecutionId: executionRequest.actionExecutionId,
    },
  };
}

module.exports = {
  clone,
  getCloneExecutionData,
};
