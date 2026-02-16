# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM deps AS development
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
EXPOSE 4000
CMD ["node", "dist/server.js"]
