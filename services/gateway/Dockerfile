FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund
COPY services/gateway ./services/gateway
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "services/gateway/index.js"]
