FROM node:carbon
WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8090

CMD forever bin/www 8090
