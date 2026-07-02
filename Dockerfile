# Étape 1 : Construction (Builder)
FROM node:20 AS builder

WORKDIR /app

# Copier tout le code source ET node_modules depuis la machine locale
COPY . .

# Construire l'application Next.js pour la production
RUN node node_modules/next/dist/bin/next build

# Étape 2 : Exécution (Runner)
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001
CMD ["node", "node_modules/next/dist/bin/next", "start", "-p", "3001", "-H", "0.0.0.0"]