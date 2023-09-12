FROM node:latest

WORKDIR /app

COPY package.json /.

RUN npm install

COPY . .

EXPOSE 6156

CMD ["node", "index.js"]