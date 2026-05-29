# Frontend — Innovatech Chile (EP2 DevOps)

Aplicación web **React + Vite** servida por **nginx**, contenerizada con Docker y
desplegada de forma automatizada a una instancia **EC2 pública** mediante GitHub
Actions. Es el único componente accesible desde Internet; consume las APIs del
backend (que vive en una subred privada) vía proxy reverso de nginx.

El backend vive en su propio repositorio:
`ev-third-year-devops-backend`.

---

## Arquitectura

```
   Internet ──► EC2 Frontend (publica)            EC2 Backend (privada)
                ┌────────────────────┐            ┌──────────────────┐
                │  nginx (no root)   │  /api/v1/  │  back-ventas:8080│
   navegador ──►│  :80 host          │──proxy────►│  back-despachos  │
                │  -> :8080 contenedor│  ventas    │      :8081        │
                │  sirve React build │  despachos │  + mysql          │
                └────────────────────┘            └──────────────────┘
```

- nginx sirve los estáticos de React y hace **proxy reverso**:
  - `/api/v1/ventas`    → `BACKEND_PRIVATE_IP:8080`
  - `/api/v1/despachos` → `BACKEND_PRIVATE_IP:8081`
- La IP privada del backend se inyecta en tiempo de arranque con **envsubst**
  (variables `BACKEND_VENTAS_HOST` / `BACKEND_DESPACHOS_HOST`).
- El backend no es accesible desde Internet: solo responde al Security Group del frontend.

---

## Estructura del repositorio

```
.
├── front_despacho/
│   ├── src/ ...            # codigo React/Vite
│   ├── nginx.conf          # config nginx (proxy a los backends, con envsubst)
│   └── Dockerfile          # build multi-stage, runtime nginx no root
├── docker-compose.yml      # levanta el frontend (local y EC2)
├── .env.example            # plantilla de variables para correr en local
└── .github/workflows/deploy.yml   # pipeline CI/CD
```

---

## Dockerfile (multi-stage + usuario no root)

1. **Etapa builder**: `node:22-alpine` instala dependencias (`npm ci`) y genera el
   build de producción (`npm run build`).
2. **Etapa runtime**: `nginxinc/nginx-unprivileged:1.27-alpine`, que corre nginx como
   **usuario no root** (principio de mínimo privilegio). Por eso nginx escucha en el
   puerto **8080** dentro del contenedor, y el host lo publica en el **80** (`80:8080`).

nginx procesa automáticamente `nginx.conf` como plantilla (`/etc/nginx/templates/`),
sustituyendo con `envsubst` las variables de las IPs del backend al iniciar.

---

## Correr en local

```bash
cp .env.example .env      # completa DOCKER_USERNAME y BACKEND_PRIVATE_IP
docker compose up -d --build
docker compose ps
```

App disponible en http://localhost (las llamadas `/api/v1/*` van a la IP de backend
que pongas en `.env`).

---

## Pipeline CI/CD (GitHub Actions)

Archivo: `.github/workflows/deploy.yml`. Se dispara con **push a la rama `deploy`**.

```
push a deploy
   │
   ├─ build-and-push
   │     1. checkout
   │     2. login en Docker Hub
   │     3. build + push de la imagen front-despacho (tags :latest y :<sha>)
   │
   └─ deploy-frontend  (needs: build-and-push)
         1. checkout
         2. scp de docker-compose.yml al EC2
         3. ssh: docker compose pull + docker compose up -d
```

El deploy en EC2 **levanta el contenedor con `docker compose`**, usando la imagen ya
publicada en Docker Hub (no compila en la instancia).

### Secrets requeridos (Settings → Secrets and variables → Actions)

| Secret | Descripción |
|---|---|
| `DOCKER_USERNAME` | Usuario de Docker Hub |
| `DOCKER_TOKEN` | Token de acceso de Docker Hub |
| `EC2_USER` | Usuario SSH del EC2 (ej. `ubuntu`) |
| `EC2_SSH_PRIVATE_KEY` | Clave privada SSH (`vockey`) |
| `EC2_HOST_FRONTEND` | IP pública del EC2 frontend |
| `BACKEND_PRIVATE_IP` | IP privada del EC2 backend (destino del proxy) |

---

## Acceso desde el navegador

Entrar por **HTTP** a la IP pública del EC2 frontend: `http://<IP_PUBLICA>`.
No hay HTTPS configurado (no es requisito); si el navegador fuerza `https://`,
escribir la URL con `http://` manualmente.

---

## Requisitos en la instancia EC2

- Docker con el **plugin Compose v2** (`docker compose version`).
  Si falta: `sudo apt-get install -y docker-compose-plugin`.
- Security Group con el puerto **80** abierto a Internet (`0.0.0.0/0`) y **22** para el deploy.
