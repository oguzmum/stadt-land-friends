FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/client/package.json packages/client/package.json
COPY packages/server/package.json packages/server/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY tsconfig.base.json ./
COPY packages ./packages

RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV CLIENT_DIST_PATH=/app/packages/client/dist

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/client/package.json ./packages/client/package.json
COPY --from=builder /app/packages/client/dist ./packages/client/dist
COPY --from=builder /app/packages/server/package.json ./packages/server/package.json
COPY --from=builder /app/packages/server/dist ./packages/server/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

EXPOSE 3001

CMD ["node", "packages/server/dist/server/src/index.js"]
