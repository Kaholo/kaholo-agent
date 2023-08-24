FROM node:18.17.0-alpine

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

# Bundle app source
COPY . .

EXPOSE 8090

CMD [ "npm", "start" ]



