
FROM node:latest

WORKDIR /usr/src/app

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "start"]