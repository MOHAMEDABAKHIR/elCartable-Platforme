# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Variables de build Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci

COPY . .

RUN npm run build --workspace=@elcartable/frontend
RUN echo "API = $VITE_API_URL"

# ---- Stage 2: Production ----
FROM nginx:alpine

COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]