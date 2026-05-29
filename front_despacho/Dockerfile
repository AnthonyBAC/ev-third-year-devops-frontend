# ─────────────────────────────────────────────
# ETAPA 1: BUILD
# Node 22 para compilar la app React/Vite a estaticos
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Primero las dependencias → aprovecha la cache de capas de Docker
COPY package.json package-lock.json ./
RUN npm ci

# Luego el codigo y el build de produccion
COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# ETAPA 2: RUNTIME
# nginx-unprivileged: corre como usuario NO root (minimo privilegio)
# y escucha en el puerto 8080 dentro del contenedor.
# ─────────────────────────────────────────────
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

# Estaticos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# La imagen oficial de nginx procesa automaticamente los .template de
# /etc/nginx/templates/ con envsubst al iniciar, inyectando las IPs del backend.
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
