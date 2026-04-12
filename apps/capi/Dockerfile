# -------------------- Builder -------------------- #
FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/capi/package.json apps/capi/package-lock.json ./

RUN npm ci

COPY apps/capi/ ./

RUN npm run build

RUN npm run prisma:generate

RUN npm prune --omit=dev

# -------------------- Runtime -------------------- #
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 3000

CMD ["node", "dist/src/main.js"]