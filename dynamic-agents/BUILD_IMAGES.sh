#!/bin/bash

VERSION=$1
PUSH=$2

rm -rf kaholo-agent-public
rsync -aP ../twiddlebug/ ./kaholo-agent-public
mkdir -p kaholo-agent-public/shared/dist && cp ../shared/package.json ./kaholo-agent-public/shared/package.json && cp ../shared/package-lock.json ./kaholo-agent-public/shared/package-lock.json
echo "export * from './amqp-sdk/amqp-sdk'; export * from './event-worker/event-worker'; export * from './helpers';" > ../shared/src/index.ts && cd ../shared && npm i && npm run build-min && cp dist/index.js ../twiddlebug/kaholo-agent-public/shared/dist/index.js
cd ../twiddlebug
cd kaholo-agent-public/shared && npm pkg set 'main'='dist/index.js'
cd ../../kaholo-agent-public && npm install --save @kaholo/shared@file:./shared
rm -rf node_modules shared/node_modules tmp uploads workspace kaholo-agent.conf

for filename in docker/dockerfiles/Dockerfile*; do
    TAG="matankaholo/agent:${VERSION}-${filename#"docker/dockerfiles/Dockerfile-"}"
    echo ${TAG,,}
    docker build -f $filename -t ${TAG,,} .
    if [[ "$PUSH" == "push" ]]
    then
        docker push ${TAG,,}
    fi
done

rm -rf ../kaholo-agent-public
rm -rf ../../shared/src/index.ts
