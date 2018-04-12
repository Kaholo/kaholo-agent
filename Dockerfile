FROM node:carbon

WORKDIR /app
COPY . .
RUN npm i

EXPOSE 8090

CMD ["node", "./core/src/app.js"]