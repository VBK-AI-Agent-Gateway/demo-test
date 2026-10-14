FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY src ./src
COPY tests ./tests
COPY jest.config.js ./

ENV NODE_ENV=production
EXPOSE 3000

# Default: API. docker-compose overrides this for the worker service.
CMD ["node", "src/server.js"]