FROM node:18.13.0

WORKDIR /app
COPY . .
RUN npm install

CMD [ "node", "app.js" ]
