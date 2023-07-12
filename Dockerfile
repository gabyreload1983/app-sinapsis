FROM node:18.13.0

RUN npm install pm2 -g

WORKDIR /app

COPY . .

RUN npm install

CMD [ "pm2-runtime","start", "app.js","-i","max" ]
