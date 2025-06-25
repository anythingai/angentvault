# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install all dependencies for building
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Install only production dependencies for runtime
FROM base AS production-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for Prisma during build
ENV DATABASE_PROVIDER=sqlite
ENV DATABASE_URL=file:./dev.db

# Generate Prisma client
RUN npx prisma generate
# Skip db push during build - will be done at runtime
# RUN npx prisma db push --skip-generate

# Build application
RUN npm run build

# Verify standalone build output exists
RUN ls -la .next/
RUN ls -la .next/standalone/ || echo "Standalone directory not found"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build and static files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public directory (create empty one if it doesn't exist)
COPY --from=builder /app/public ./public

# Copy additional required files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Copy package files for runtime dependencies
COPY --from=builder /app/package.json ./package.json
COPY --from=production-deps /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
EXPOSE 4000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENV DATABASE_PROVIDER=sqlite
ENV DATABASE_URL=file:./dev.db

# Start both frontend and backend
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"] 