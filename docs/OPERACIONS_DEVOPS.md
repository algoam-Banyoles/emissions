# Operacions DevOps i Desplegament

## 1. Arquitectura de Produccio

- Frontend: Vite build desplegat com a contingut static (Nginx, S3+CloudFront, Vercel o Netlify).
- Backend: Node.js/Express en contenidor Docker.
- Base de dades: PostgreSQL gestionat (AWS RDS / Azure Database for PostgreSQL / Cloud SQL).
- Cache/rutes: Redis gestionat (ElastiCache / Azure Cache for Redis / Memorystore).
- Fitxers: S3 (o Blob Storage / GCS).

## 2. Docker local

### Desenvolupament

```bash
docker compose up -d --build
```

Serveis:
- frontend: `http://localhost:5173`
- backend: `http://localhost:4000`
- postgres: `localhost:5432`
- redis: `localhost:6379`

### Produccio (entorn self-host)

```bash
docker compose -f docker-compose.prod.yml up -d
```

## 3. Kubernetes (EKS / AKS / GKE)

Manifests base a `infra/k8s/`:
- `backend-deployment.yaml`
- `frontend-deployment.yaml`
- `services.yaml`
- `ingress.yaml`
- `configmap.yaml`
- `secrets.example.yaml`

Flux recomanat:
1. Crear namespace (`emissions-staging` / `emissions-production`).
2. Crear `Secret` real basat en `secrets.example.yaml`.
3. Aplicar manifests.
4. Actualitzar imatges via CI/CD (`kubectl set image ...`).

## 4. CI/CD (GitHub Actions)

- `ci-tests.yml`: validacio de qualitat (tests/cobertura).
- `cd-deploy.yml`:
  - `push` a `main`: build imatges + deploy automatic a staging.
  - `workflow_dispatch`: deploy manual (staging/production).
  - Migracions Prisma automatiques abans del deploy.
- `db-backup.yml`:
  - Backup diari amb `pg_dump` cap a S3.

Secrets necessaris (GitHub):
- `KUBE_CONFIG_STAGING`, `KUBE_CONFIG_PRODUCTION` (base64 kubeconfig)
- `DATABASE_URL_STAGING`, `DATABASE_URL_PRODUCTION`
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BACKUP_BUCKET`

## 5. Migracions i Base de Dades

Migracions aplicades automàticament a CI/CD:

```bash
npm --prefix backend run prisma:migrate:deploy
```

Backups manuals:

```bash
DATABASE_URL=... S3_BACKUP_BUCKET=... bash scripts/db-backup.sh
```

## 6. Monitoritzacio i observabilitat

### Logs
- Winston integrat al backend (`backend/src/config/logger.ts`).
- Format JSON en produccio per ingestio a CloudWatch/Datadog.

### Errors
- Sentry integrat al backend (`backend/src/config/sentry.ts`).
- Configurar `SENTRY_DSN` per activar captura.

### Metriques
- AWS: CloudWatch + alarms (CPU, mem, 5xx, latencia).
- Azure: Azure Monitor + Application Insights.
- GCP: Cloud Monitoring + Error Reporting.
- Datadog (opcional): agent a cluster + ingestio logs/metriques/traces.

## 7. Variables d'entorn clau

Backend (`backend/.env.example`):
- `DATABASE_URL`, `REDIS_URL`, `JWT_*`, `CORS_ORIGIN`
- `LOG_LEVEL`, `SENTRY_DSN`
- `AWS_REGION`, `S3_BUCKET`

Frontend (`.env.example`):
- `VITE_API_URL`
- `VITE_SENTRY_DSN` (opcional)

## 8. Scripts de deploy

- `scripts/deploy-staging.sh`
- `scripts/deploy-production.sh`
- `scripts/deploy-frontend-s3.sh`
- `scripts/db-backup.sh`

## 9. Notes cloud per proveidor

### AWS
- Compute: EKS (o ECS Fargate).
- DB: RDS PostgreSQL.
- Cache: ElastiCache Redis.
- Storage: S3 (+ CloudFront frontend).
- Logs/metriques: CloudWatch.

### Azure
- Compute: AKS.
- DB: Azure Database for PostgreSQL.
- Cache: Azure Cache for Redis.
- Storage: Blob Storage + CDN.
- Logs/metriques: Azure Monitor.

### GCP
- Compute: GKE.
- DB: Cloud SQL PostgreSQL.
- Cache: Memorystore Redis.
- Storage: GCS + Cloud CDN.
- Logs/metriques: Cloud Monitoring.
