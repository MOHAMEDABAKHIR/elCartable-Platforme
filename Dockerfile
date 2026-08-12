# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

# Variables de build Vite
ARG VITE_API_URL
ARG VITE_SUPPORT_PHONE
ARG VITE_WHATSAPP_NUMBER
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SUPPORT_PHONE=$VITE_SUPPORT_PHONE
ENV VITE_WHATSAPP_NUMBER=$VITE_WHATSAPP_NUMBER

COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/package.json
RUN npm ci

COPY . .

RUN npm run build --workspace=@elcartable/frontend
RUN echo "API = $VITE_API_URL / PHONE = $VITE_SUPPORT_PHONE / WA = $VITE_WHATSAPP_NUMBER"

# ---- Stage 2: Production ----
FROM nginx:alpine

COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]