FROM node:20-alpine AS base

FROM base AS deps
# Reference: https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk update && \ 
    apk upgrade && \
    apk add --no-cache libc6-compat && \
    apk add dumb-init
WORKDIR /app
COPY package.json yarn.lock ./
COPY prisma ./
RUN yarn --frozen-lockfile --ignore-engines

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build \
    && mkdir logs \
    && mkdir uploads

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 core 
USER core

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.env.example ./.env.example
COPY --from=builder /app/package.json .
COPY prisma ./

COPY --from=builder --chown=core:nodejs /app/dist ./dist
COPY --from=builder --chown=core:nodejs /app/logs ./logs
COPY --from=builder --chown=core:nodejs /app/uploads ./uploads

EXPOSE 3000
ENV PORT 3000
ENV NODE_ENV production

CMD ["dumb-init", "node", "dist/index.js"]