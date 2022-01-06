FROM node:14.15.2-buster

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

RUN apt update
RUN apt install -y apt-transport-https ca-certificates curl gnupg2 software-properties-common
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
RUN add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/debian $(lsb_release -cs) stable"
RUN apt update
RUN apt install -y docker-ce-cli


EXPOSE 8090

CMD [ "npm", "start" ]



