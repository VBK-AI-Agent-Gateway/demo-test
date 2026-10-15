FROM node:20-alpine

WORKDIR /app

# Install dependencies first for layer caching
COPY package.json ./
RUN npm install

COPY prisma ./prisma
COPY src ./src
COPY jest.config.js ./
COPY tests ./tests

# Generate Prisma client
RUN npx prisma generate

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.js && node src/server.js"]