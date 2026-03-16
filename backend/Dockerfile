FROM node:18-alpine

WORKDIR /app

COPY backend/package*.json ./

RUN npm install --production

COPY backend/ ./

RUN mkdir -p data/files

EXPOSE 8080

CMD ["npm", "start"]
