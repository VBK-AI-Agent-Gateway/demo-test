FROM node:20-alpine

WORKDIR /app

# better-sqlite3 needs build tools on alpine
RUN apk add --no-cache python3 make g++

COPY package.json ./
RUN npm install

COPY src ./src
COPY public ./public
COPY tests ./tests
COPY jest.config.js ./

ENV NODE_ENV=production
ENV DB_PATH=/app/data/app.db
EXPOSE 3000

CMD ["node", "src/server.js"]