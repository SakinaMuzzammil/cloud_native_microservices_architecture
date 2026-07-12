FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund || npm install --omit=dev --no-audit --no-fund
COPY monolith ./monolith
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "monolith/index.js"]
