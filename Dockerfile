FROM node:18-alpine
WORKDIR /home/node/app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN chown -R node:node /home/node/app
USER node
EXPOSE 80
CMD ["node", "server.js"]
