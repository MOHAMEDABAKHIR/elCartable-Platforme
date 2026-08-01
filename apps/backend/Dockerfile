# ==========================
# Stage 1 : Build
# ==========================
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

# Copier tout le projet
COPY . .

# Installer toutes les dépendances sans lancer postinstall
RUN npm ci --ignore-scripts

# Générer Prisma
RUN npm run prisma:generate --workspace=@elcartable/backend

# Compiler NestJS
RUN npm run build --workspace=@elcartable/backend


# ==========================
# Stage 2 : Runtime
# ==========================
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copier tout le projet construit
COPY --from=build /app ./

# Installer uniquement les dépendances de production
RUN npm ci --omit=dev --ignore-scripts

EXPOSE 3000

CMD ["npm", "run", "start:prod", "--workspace=@elcartable/backend"]