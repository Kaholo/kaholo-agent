FROM node:10.15.0

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm i
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

EXPOSE 9292

CMD [ "npm", "start" ]



