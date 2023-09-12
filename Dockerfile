FROM node:latest

WORKDIR /index.js

COPY package.json /index.js

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "start"]