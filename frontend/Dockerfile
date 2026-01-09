# ── Aşama 1: Build ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./

# npm install kullan (keycloak-js dahil tüm bağımlılıklar)
RUN npm install --silent

# keycloak-js yoksa ekle
RUN npm install keycloak-js --silent

COPY . .
RUN npm run build

# ── Aşama 2: Nginx ile Servis ─────────────────────────────────
FROM nginx:1.25-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
