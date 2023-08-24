#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status
set -o pipefail # Causes a pipeline to return the exit status of the last command in the pipe that returned a non-zero return value

KAH_REPO_BASE_PATH=$(pwd)/../

cd $KAH_REPO_BASE_PATH
rm -rf twiddlebug/kaholo-agent-public
rsync -aP twiddlebug/ twiddlebug/kaholo-agent-public
mkdir -p twiddlebug/kaholo-agent-public/shared/dist && cp shared/package.json twiddlebug/kaholo-agent-public/shared/package.json && cp shared/package-lock.json twiddlebug/kaholo-agent-public/shared/package-lock.json
# replace index.min with index to include only required modules
mv shared/src/index.min.ts shared/src/index.ts
cd shared && npm i && npm run build-min && cp dist/index.js ../twiddlebug/kaholo-agent-public/shared/dist/index.js
cd $KAH_REPO_BASE_PATH/twiddlebug/kaholo-agent-public/shared
npm pkg set 'main'='dist/index.js'
cd $KAH_REPO_BASE_PATH/twiddlebug/kaholo-agent-public
npm install --save @kaholo/shared@file:./shared
rm -rf node_modules shared/node_modules tmp uploads workspace kaholo-agent.conf dynamic-agents/BUILD_IMAGES.sh
