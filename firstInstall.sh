BASE_URL=$1
SERVER_URL=$2
SERVER_USERNAME=$3
SERVER_PASSWORD=$4

# install node 4.x
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
apt-get install -y nodejs

FS = pwd

# install git
apt-get install -y git

#install npm dependencies
npm i -g forever grunt-cli

#create pm folder
cd $FS
mkdir production-map
cd production-map

#clone server
git clone -b develop https://github.com/ProductionMap/production-map-base-agent.git
cd production-map-base-agent/production-map-base-agent
npm i

#update server
cd utils
node register.js $BASE_URL $SERVER_USERNAME $SERVER_PASSWORD $SERVER_URL