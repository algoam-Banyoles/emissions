# Emissionsv2 SaaS

Aplicacio base SaaS multi-tenant per a optimitzacio de ferms i certificats ambientals.

## Stack

- Vite + React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Zustand
- ESLint + Prettier (estrictes)
- Husky + lint-staged

## Colors corporatius

- Blau fosc: `#1e3a5f`
- Verd: `#2d8a4e`
- Gris: `#f5f5f5`

## Instal.lacio

```bash
npm install
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run type-check
npm run format
npm run docker:up
npm run docker:down
npm run docker:prod
npm run deploy:frontend:s3
```

## DevOps

- Runbook d'operacions: `docs/OPERACIONS_DEVOPS.md`
- Docker backend: `backend/Dockerfile`
- Docker frontend: `Dockerfile`
- Compose dev: `docker-compose.yml`
- Compose prod: `docker-compose.prod.yml`
- CI/CD workflows: `.github/workflows/`

## Git hooks

```bash
npm run prepare
```

El hook `pre-commit` executa:

- `lint-staged`
- `npm run type-check`

## Estructura

```text
src/
  components/
    ui/
    forms/
    layout/
  hooks/
  lib/
  pages/
  services/
  stores/
  types/
  utils/
public/
tests/
```
