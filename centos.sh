# install node 6.x
yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_6.x | sudo -E bash -
yum -y install nodejs

# install git
yum install git -y

#install npm dependencies
npm i -g forever

#create pm folder
mkdir -p /var/production-map
cd /var/production-map

#clone server
git clone -b develop https://github.com/ProductionMap/production-map-base-agent.git
cd production-map-base-agent/production-map-base-agent
npm i
