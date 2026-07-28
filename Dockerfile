# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Copier uniquement les fichiers de dépendances d'abord
# → Docker met en cache cette étape si les deps n'ont pas changé
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci

# Copier tout le reste du code
COPY . .

# Build du frontend uniquement
RUN npm run build --workspace=@elcartable/frontend

# ---- Stage 2: Production (Nginx) ----
FROM nginx:alpine
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]