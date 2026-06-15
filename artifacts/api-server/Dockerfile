FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ─── Dependencies ─────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/db/package.json ./lib/db/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
RUN pnpm install --frozen-lockfile --ignore-scripts

# ─── Build ────────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY . .
WORKDIR /app/artifacts/api-server
RUN pnpm build

# ─── Production ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN addgroup --system --gid 1001 sanad && adduser --system --uid 1001 sanad

WORKDIR /app
COPY --from=builder --chown=sanad:sanad /app/artifacts/api-server/dist ./dist

USER sanad
EXPOSE 8080
ENV NODE_ENV=production
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
