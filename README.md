# kaholo-agent
Used for executing Kaholo pipelines

## Requirements
- NodeJS >= 10.x

## Install

### Install as Windows service
In order to install the Kaholo agent as a windows service do the following:
- Clone the repo
- Move to repo directory
- `npm install --production`
- `npm install node-windows`
- Rename `kaholo-agent.conf.example` to `kaholo-agent.conf`
- Set configuration in `kaholo-agent.conf` 
- `npm run install:windows`

### Install as OSX service
In order to install the Kaholo agent as a service on OSX do the following:
- clone the repo
- move to repo directory
- `npm install --production`
- `npm install node-mac`
- Rename `kaholo-agent.conf.example` to `kaholo-agent.conf`
- Set configuration in `kaholo-agent.conf` 
- `npm run install:osx`

### More installaion options
For all installaion options please visit our [documentation]


## Configrution
All configuration options can be found in `kaholo-agent.conf`.
- SERVER_URL: The Kaholo server URL.
- AGENT_KEY: Random 32 bytes string, the unique identifier for the agent

[documentation]: https://kaholo.io/blog/documents/kaholo-user-guide/installing-kaholo/installing-kaholo-agent/
