# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Copier les fichiers de dépendances d'abord (cache Docker)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci

# Copier le reste du code (dont le schema Prisma)
COPY . .

# Générer le client Prisma (nécessaire avant le build NestJS)
RUN npm run prisma:generate --workspace=@elcartable/backend

# Build NestJS → génère le dossier dist/
RUN npm run build --workspace=@elcartable/backend

# ---- Stage 2: Production ----
FROM node:20-alpine
WORKDIR /app

# On copie seulement ce qui est nécessaire pour tourner en prod
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/package.json
RUN npm ci --omit=dev

# Le client Prisma généré + le code compilé
COPY --from=build /app/apps/backend/dist ./apps/backend/dist
COPY --from=build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "apps/backend/dist/main"]