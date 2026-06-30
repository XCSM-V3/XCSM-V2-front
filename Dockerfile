# Étape 1 : Construction (Builder)
FROM node:20-alpine AS builder

# Définir le dossier de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json package-lock.json* ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Construire l'application Next.js pour la production
RUN npm run build

# Étape 2 : Exécution (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

# Variables d'environnement pour la production
ENV NODE_ENV production
ENV PORT 3001

# Ne copier que les fichiers nécessaires de l'étape builder
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3001

# Démarrer l'application (en s'assurant d'écouter sur 0.0.0.0 pour Docker)
CMD ["npx", "next", "start", "-p", "3001", "-H", "0.0.0.0"]
