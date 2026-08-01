# =========================
# Stage 1 : Build
# =========================
FROM node:20-alpine AS build

WORKDIR /app

# Évite certains problèmes Prisma/OpenSSL
RUN apk add --no-cache openssl

# Copier tout le projet
COPY . .

# Installer les dépendances sans exécuter postinstall
RUN npm ci --ignore-scripts

# Générer le client Prisma
RUN npm run prisma:generate --workspace=@elcartable/backend

# Compiler NestJS
RUN npm run build --workspace=@elcartable/backend


# =========================
# Stage 2 : Production
# =========================
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copier tout le projet construit
COPY --from=build /app ./

# Installer uniquement les dépendances de production
# sans relancer prisma generate
RUN npm ci --omit=dev --ignore-scripts

# Copier le client Prisma généré
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000

CMD ["npm", "run", "start:prod", "--workspace=@elcartable/backend"]