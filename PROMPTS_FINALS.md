# PROMPTS FINALS PER CODEX - AMB TOTES LES OBSERVACIONS INCORPORADES

## ÍNDEX DE PROMPTS (27 totals)

### FASE 1: Estructura Base (3 prompts)
- 1.1: Inicialització del Projecte
- 1.2: Backend Base i Base de Dades (amb PostgreSQL explícit)
- 1.3: Sistema d'Autenticació

### FASE 2: Gestió de Dades (10 prompts)
- 2.1: CRUD de Projectes (amb càlcul categoria trànsit)
- 2.2: Gestió de Materials
- 2.2b: Base de Dades d'Esplanades i Seccions (NOU)
- 2.3: Base de Dades d'Emissions - Estructura
- 2.4: Seed de Base de Dades d'Emissions
- 2.5: Gestió de Factors d'Emissió
- 2.6: Importació/Exportació Emissions
- 2.7: Validació de Dades d'Emissions
- 2.8: Georeferenciació i Mapes
- 2.8b: Gestió d'Ubicacions amb Modal i APIs (NOU)

### FASE 3: Càlculs (6 prompts)
- 3.1: Motor de Càlcul Estructural
- 3.2: Generador d'Estructures
- 4.1: Calculadora d'Emissions A1-A5
- 4.2: Integració Emissions-Estructura
- 5.1: Algoritmes d'Optimització
- 5.2: Càlculs Econòmics

### FASE 4: Certificats i Integracions (4 prompts)
- 6.1: Generador de Certificats PDF
- 6.2: Verificació de Compliment
- 7.1: Integració GIS Completa
- 7.2: Integració BIM (IFC)

### FASE 5: Internacionalització (2 prompts)
- 8.1: Sistema d'Internacionalització
- 8.2: Traducció de Contingut Dinàmic

### FASE 6: Testing i Desplegament (2 prompts)
- 9.1: Testing Complet
- 9.2: Desplegament i DevOps

---

## FASE 1: ESTRUCTURA BASE

### Prompt 1.1: Inicialització del Projecte

```
Crea l'estructura base d'una aplicació SaaS multi-tenant per a optimització de ferms i certificats ambientals.

REQUISITS:
1. Inicialitza un projecte amb Vite + React 18 + TypeScript
2. Configura Tailwind CSS amb tema personalitzat:
   - Colors corporatius:
     * Primari: #1e3a5f (blau fosc)
     * Secundari: #2d8a4e (verd)
     * Fons: #f5f5f5 (gris clar)
     * Alerta: #dc3545 (vermell)
     * Avís: #ffc107 (groc)
     * Èxit: #28a745 (verd clar)
3. Instal·la i configura shadcn/ui amb components base
4. Configura ESLint + Prettier amb regles estrictes
5. Configura Husky per a pre-commit hooks (lint + type-check)
6. Crea l'estructura de carpetes:
   - src/
     - components/ (ui/, forms/, layout/, map/)
     - hooks/
     - lib/
     - pages/
     - services/
     - stores/ (Zustand)
     - types/
     - utils/
   - public/
   - tests/

ENTREGABLES:
- package.json amb totes les dependències
- tsconfig.json configurat
- tailwind.config.js amb tema personalitzat
- vite.config.ts configurat
- .eslintrc.json i .prettierrc
- .husky/pre-commit
- Estructura de carpetes creada
- README.md amb instruccions d'instal·lació
```

### Prompt 1.2: Backend Base i Base de Dades (amb PostgreSQL explícit)

```
Crea el backend base amb Node.js, Express i PostgreSQL, configurant EXPLÍCITAMENT la base de dades.

REQUISITS:

1. Inicialitzar projecte Node.js:
   - npm init -y
   - Instal·lar TypeScript: npm install -D typescript @types/node ts-node ts-node-dev
   - Configurar tsconfig.json

2. Instal·lar dependències:
   - npm install express @types/express
   - npm install prisma @prisma/client
   - npm install dotenv helmet cors compression morgan
   - npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
   - npm install zod
   - npm install winston

3. Configurar PostgreSQL EXPLÍCITAMENT:
   
   a) Crear fitxer .env amb variables d'entorn:
      ```
      # Database Configuration
      DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/calculadora_firmes?schema=public"
      
      # JWT Configuration
      JWT_SECRET="your-secret-key-here-min-32-chars"
      JWT_REFRESH_SECRET="your-refresh-secret-key-here"
      
      # Server Configuration
      PORT=3001
      NODE_ENV=development
      
      # Frontend URL (per CORS)
      FRONTEND_URL="http://localhost:5173"
      
      # API Keys (per a serveis externs)
      OPENROUTESERVICE_API_KEY=""
      GEOAPIFY_API_KEY=""
      ```
   
   b) Crear fitxer .env.example (mateixa estructura sense valors reals)
   
   c) Crear script setup-database.sh:
      ```bash
      #!/bin/bash
      echo "=== Configuració de la Base de Dades PostgreSQL ==="
      echo ""
      echo "Aquest script crearà la base de dades 'calculadora_firmes'"
      echo ""
      read -p "Introdueix l'usuari de PostgreSQL [postgres]: " DB_USER
      DB_USER=${DB_USER:-postgres}
      
      read -s -p "Introdueix la contrasenya de PostgreSQL: " DB_PASSWORD
      echo ""
      
      read -p "Introdueix el host [localhost]: " DB_HOST
      DB_HOST=${DB_HOST:-localhost}
      
      read -p "Introdueix el port [5432]: " DB_PORT
      DB_PORT=${DB_PORT:-5432}
      
      # Crear base de dades
      PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE calculadora_firmes;" 2>/dev/null || echo "La base de dades ja existeix"
      
      # Crear usuari específic (opcional)
      PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE USER firmes_user WITH PASSWORD 'firmes_password';" 2>/dev/null || echo "L'usuari ja existeix"
      PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "GRANT ALL PRIVILEGES ON DATABASE calculadora_firmes TO firmes_user;"
      
      echo ""
      echo "=== Base de dades configurada correctament ==="
      echo ""
      echo "Ara edita el fitxer .env amb les teves credencials:"
      echo "DATABASE_URL=\"postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/calculadora_firmes?schema=public\""
      ```
   
   d) Instruccions a README.md:
      ```markdown
      ## Configuració de la Base de Dades
      
      ### Opció 1: PostgreSQL Local (Recomanat)
      1. Instal·la PostgreSQL 14+ (https://www.postgresql.org/download/)
      2. Executa: `./setup-database.sh`
      3. Edita `.env` amb les teves credencials
      
      ### Opció 2: Docker
      ```bash
      docker run --name postgres-firmes \
        -e POSTGRES_PASSWORD=yourpassword \
        -e POSTGRES_DB=calculadora_firmes \
        -p 5432:5432 \
        -d postgres:14
      ```
      
      ### Opció 3: Servei Cloud (Railway, Supabase, AWS RDS)
      1. Crea una instància PostgreSQL
      2. Copia la DATABASE_URL
      3. Pega-la al fitxer `.env`
      ```

4. Configurar Prisma:
   - npx prisma init
   - Configurar schema.prisma amb provider "postgresql"
   
5. Crear models inicials:
   - Organitzacio
   - Usuari
   - Projecte
   - VersioBaseDades

6. Scripts package.json:
   - dev, build, start
   - db:migrate, db:generate, db:studio
   - db:seed, db:seed:emissions, db:seed:esplanades

7. Estructura de carpetes backend

ENTREGABLES:
- package.json complet
- tsconfig.json
- prisma/schema.prisma amb models inicials
- .env i .env.example
- setup-database.sh executable
- src/config/database.ts
- src/config/env.ts (validació Zod)
- README.md amb instruccions
```

### Prompt 1.3: Sistema d'Autenticació

```
Implementa el sistema d'autenticació complet amb JWT i refresh tokens.

REQUISITS:
1. Backend:
   - Endpoints: POST /auth/register, /auth/login, /auth/refresh, /auth/logout
   - Middleware de verificació JWT
   - Hash de contrasenyes amb bcrypt
   - Rate limiting per a login

2. Frontend:
   - Pàgines de login i registre
   - Formularis amb validació Zod
   - Gestió d'estat amb Zustand
   - Protected routes

3. Seguretat:
   - Tokens JWT (15 min), Refresh tokens (7 dies)
   - httpOnly cookies per a refresh
   - Validació de fortalesa de contrasenya

ENTREGABLES:
- Backend: auth.controller.ts, auth.service.ts, auth.routes.ts, auth.middleware.ts
- Frontend: Login.tsx, Register.tsx, useAuth.ts, auth.store.ts, ProtectedRoute.tsx
- Tests unitaris
```

---

## FASE 2: GESTIÓ DE DADES

### Prompt 2.1: CRUD de Projectes (amb Càlcul de Categoria de Trànsit)

```
Implementa la gestió completa de projectes amb càlcul automàtic de categoria de trànsit.

REQUISITS:
1. Backend:
   - Model Projecte amb:
     * imd: Intensitat mitjana diària (vehicles/dia)
     * percentatge_vp: Percentatge de vehicles pesants (%)
     * categoria_transit_auto: String (calculat automàticament)
     * categoria_transit_manual: String (opcional)
     * usa_categoria_manual: Boolean
   
   - Funció calcularCategoriaTransit(IMD, %VP):
     ```
     CATEGORIA | IMD (veh/dia)   | %VP
     ----------|-----------------|------
     TT1       | < 150           | < 10%
     TT2       | 150 - 1.500     | 10-20%
     TT3       | 1.500 - 6.000   | 15-25%
     TT4       | 6.000 - 15.000  | 20-30%
     TT5       | > 15.000        | > 25%
     ```
     * Si no encaixa exactament, retorna la més restrictiva
   
   - Endpoints CRUD per a Projecte

2. Frontend:
   - Formulari amb:
     * IMD (numèric)
     * %VP (numèric, 0-100)
     * Checkbox "Seleccionar categoria manualment"
     * Selector de categoria (TT1-TT5) - visible només si checkbox activat
     * Display de categoria calculada automàticament (temps real)
   
   - Component CategoriaTransitDisplay

3. Validacions:
   - IMD >= 0
   - 0 <= %VP <= 100

ENTREGABLES:
- Backend: projects.controller.ts, projects.service.ts
- Frontend: ProjectForm.tsx, CategoriaTransitDisplay.tsx, useProjects.ts
- Tests
```

### Prompt 2.2: Gestió de Materials

```
Implementa la gestió de materials i el sistema de versions de la base de dades.

REQUISITS:
1. Backend:
   - Model Material amb propietats estructurals i ambientals
   - Endpoints CRUD (només admin)
   - Sistema de versions amb VersioBaseDades
   - Importació CSV/Excel

2. Frontend (admin):
   - Pàgina de gestió de materials
   - Pàgina de versions
   - Modal per importar fitxers

3. Seguretat:
   - Middleware de verificació de rol admin
   - Logs d'auditoria

ENTREGABLES:
- Backend: materials.controller.ts, materials.service.ts, versions.service.ts
- Frontend: MaterialsAdmin.tsx, VersionsAdmin.tsx, ImportModal.tsx
```

### Prompt 2.2b: Base de Dades d'Esplanades i Seccions (NOU)

```
Crea la base de dades completa d'esplanades i seccions segons la Norma 6.1 IC.

NOTA IMPORTANT: Usa EXACTAMENT aquestes dades (no facis scraping):

REQUISITS:

1. Model TipusEsplanada (5 tipus):
   
   E1 - Roca de molt bona qualitat:
   - Resistència: > 100 MPa
   - Coeficient K: > 100 MN/m³
   - Categories: TT1, TT2, TT3, TT4, TT5
   
   E2 - Roca de bona qualitat:
   - Resistència: 50-100 MPa
   - Coeficient K: 50-100 MN/m³
   - Categories: TT1, TT2, TT3, TT4, TT5
   
   E3 - Roca de qualitat mitjana:
   - Resistència: 25-50 MPa
   - Coeficient K: 25-50 MN/m³
   - Categories: TT1, TT2, TT3, TT4
   
   E4 - Sòls granulars:
   - Resistència: 5-25 MPa
   - Coeficient K: 10-25 MN/m³
   - Categories: TT1, TT2, TT3
   
   E5 - Sòls fins:
   - Resistència: < 5 MPa
   - Coeficient K: < 10 MN/m³
   - Categories: TT1, TT2

2. Model SeccioTipus (4 seccions):
   
   S1 - CR + CI + CB (Secció mínima)
   S2 - CR + CI + CB + CS (Amb subbase)
   S3 - CR + CB + CS (Sense intermèdia)
   S4 - CR + CI + CB + CS + CTR (Amb tractament)

3. Model CombinacioEsplanadaSeccio:
   
   COMBINACIONS (esplanada + trànsit → seccions):
   
   // TT1
   E1+TT1 → S1,S2,S3
   E2+TT1 → S1,S2,S3
   E3+TT1 → S1,S2,S3
   E4+TT1 → S1,S2,S3
   E5+TT1 → S2,S3,S4
   
   // TT2
   E1+TT2 → S1,S2
   E2+TT2 → S1,S2
   E3+TT2 → S1,S2
   E4+TT2 → S1,S2
   E5+TT2 → S2,S4
   
   // TT3
   E1+TT3 → S1,S2
   E2+TT3 → S1,S2
   E3+TT3 → S1,S2
   E4+TT3 → S2
   E5+TT3 → S2,S4
   
   // TT4
   E1+TT4 → S1,S2
   E2+TT4 → S1,S2
   E3+TT4 → S2
   E4+TT4 → S2
   E5+TT4 → S2,S4
   
   // TT5
   E1+TT5 → S1,S2
   E2+TT5 → S2
   E3+TT5 → S2
   E4+TT5 → S2
   E5+TT5 → S4

4. Frontend:
   - SelectorTipusEsplanada (dropdown amb descripció)
   - DisplaySeccionsPermeses (mostra seccions disponibles)

5. Seed script amb TOTES les dades

ENTREGABLES:
- Models Prisma: TipusEsplanada, SeccioTipus, CombinacioEsplanadaSeccio
- Seed: seed-esplanades.ts
- Frontend: SelectorTipusEsplanada.tsx, DisplaySeccionsPermeses.tsx
- Service: esplanades.service.ts
```

### Prompt 2.3: Base de Dades d'Emissions - Estructura

```
Crea l'estructura completa de la base de dades d'emissions segons l'OC 3/2024.

REQUISITS:
Models Prisma per a:

1. FactorEmissioMaterial (A1 - Producció):
   - id, codi_material, nom, categoria
   - factor_emissio (kg CO2e/unitat)
   - unitat (kg, t, m3, l)
   - font_dades (DAP SEVE, MITERD, etc.)
   - any_referencia, versio_dap
   - incertesa_percentatge
   - actiu, versio_bd_id

2. FactorEmissioTransport (A2/A4 - Transport):
   - id, tipus_vehicle, capacitat_tonelades
   - factor_emissio (kg CO2e/t·km)
   - combustible, font_dades

3. ConstantCalorifica (A3 - Fabricació):
   - id, nom_material, calor_especific (kJ/kg·K)

4. CombustibleFabricacio (A3):
   - id, nom_combustible, PCI (MJ/kg)
   - factor_emissio

5. ConsumElectric (A3):
   - id, tipus_consum, consum_kwh_per_tona
   - factor_emissio_red, factor_emissio_grupo

6. EquipPosadaEnObra (A5):
   - id, nom_equip, factor_emissio (kg CO2e/h)
   - rendiment_hores_per_tona

7. LimitNormatiuEmissions:
   - id, tipologia_mescla, valor_limit

ENTREGABLES:
- prisma/schema.prisma amb tots els models
- Migracions Prisma
- Documentació de l'estructura
```

### Prompt 2.4: Seed de Base de Dades d'Emissions (Dades Inicials COMPLETES)

```
Crea el seed de la base de dades amb TOTS els factors d'emissió oficials.

REQUISITS:
Script de seed (prisma/seed-emissions.ts) que insereixi:

a) FACTORS D'EMISSIÓ A1 (26 materials amb codis):
   // Codis 10a-19d
   - arido_natural: 4.48 kg CO2e/t (DAP FdA AN, 2022) - CODI 10a
   - arido_siderurgico: 3.69 kg CO2e/t (DAP FdA AA, 2022) - CODI 10b
   - polvo_caco3: 4.48 kg CO2e/t (DAP FdA AN, 2022) - CODI 12a
   - polvo_caoh2: 300.32 kg CO2e/t (DAP EULA, 2024) - CODI 12b
   - polvo_cemento: 427.8 kg CO2e/t (DAP IECA, 2023) - CODI 12c
   - RA_tratado: 2.16 kg CO2e/t (DAP FdA AN, 2023) - CODI 13
   - betun_convencional: 272.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14a
   - betun_PNFVU: 254.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14b
   - betun_PMB: 465.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14c
   - betun_PMB_caucho: 359.5 kg CO2e/t - CODI 14d
   - emulsion_C60B4: 227.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14e
   - emulsion_C65B4: 227.0 kg CO2e/t - CODI 14f
   - emulsion_C60B5: 227.0 kg CO2e/t - CODI 14g
   - emulsion_C65B5: 227.0 kg CO2e/t - CODI 14h
   - fibras_celulosa: 229.0 kg CO2e/t - CODI 15
   - RARx_caco3: -141.0 kg CO2e/t (DAP CIRTEC, 2024) - CODI 16a
   - RARx_caoh2: -59.6 kg CO2e/t (DAP CIRTEC, 2024) - CODI 16b
   - RARx_tyrexol: -1060.3 kg CO2e/t - CODI 16c
   - aditivo_semicalefacto: 1190.0 kg CO2e/t - CODI 17
   - PVC_filler: 0.0 kg CO2e/t (Pendiente) - CODI 18
   - cal_hidratada: 892.0 kg CO2e/t - CODI 19a
   - cemento_CEM_I: 778.0 kg CO2e/t - CODI 19b
   - cemento_CEM_II: 649.8 kg CO2e/t - CODI 19c
   - cemento_CEM_III: 427.8 kg CO2e/t - CODI 19d

b) FACTORS DE TRANSPORT (A2/A4 - 3 vehicles):
   - camion_semirremolque_40t: 0.0849 kg CO2e/t·km - CODI 20/40
   - camion_rigido_18t: 0.17 kg CO2e/t·km - CODI 21
   - camion_cisterna_40t: 0.0881 kg CO2e/t·km - CODI 22

c) CONSTANTS CALORÍFIQUES (A3):
   - aridos_naturales: 0.835 kJ/kg·K
   - arido_siderurgico: 0.78 kJ/kg·K
   - betun: 2.093 kJ/kg·K
   - RA: 0.89161 kJ/kg·K
   - aigua: 4.184 kJ/kg·K
   - calor_vaporitzacio: 2.25 MJ/kg

d) COMBUSTIBLES (A3 - codis 31-33):
   - gasoleo: PCI=43.0 MJ/kg, FE=3.17 kg CO2e/kg - CODI 31
   - fueloleo: PCI=40.4 MJ/kg, FE=93.2 kg CO2e/GJ - CODI 32
   - gas_natural: PCI=48.31 MJ/kg, FE=70.19 kg CO2e/GJ - CODI 33

e) CONSUM ELÈCTRIC (A3 - codis 34a-34c):
   - motors_central: 1.5 kWh/t, FE=0.283 kg CO2e/kWh - CODI 34b
   - grup_electrogen: FE=0.84956 kg CO2e/kWh - CODI 34a
   - calentament_ligants: 0.5 kWh/t, FE=0.94466 kg CO2e/kWh - CODI 34c

f) PALA CARREGADORA (A3 - codi 30):
   - pala_carregadora: 0.0129 h/t, 71.78 kg CO2e/h

g) EQUIPS POSADA EN OBRA (A5 - codis 50-59):
   - silo_transferencia: 147.8 kg CO2e/h, 0.008 h/t - CODI 50
   - extendedora: 117.085 kg CO2e/h, 0.008 h/t - CODI 51
   - compactador_tandem_11t: 34.0 kg CO2e/h, 0.008 h/t - CODI 52
   - compactador_tandem_15t: 51.18 kg CO2e/h, 0.004 h/t - CODI 53
   - compactador_neumaticos_35t: 65.8676 kg CO2e/h, 0.004 h/t - CODI 54
   - minibarredora: 25.043 kg CO2e/h, 0.004 h/t - CODI 55
   - fresadora_2_2m: 266.4 kg CO2e/h, 0.004 h/t - CODI 56
   - fresadora_1m: 124.35714 kg CO2e/h, 0.001 h/t - CODI 57a
   - fresadora_0_35m: 30.44286 kg CO2e/h, 0.004 h/t - CODI 57b
   - recicladora: 386.9 kg CO2e/h, 0.004 h/t - CODI 58
   - camion_bascualnte_40t: 159.2 kg CO2e/h, 0.001 h/t - CODI 59a
   - camion_3ejes_14t: 122.05714 kg CO2e/h, 0.004 h/t - CODI 59b
   - camion_cisterna_obra: 159.2 kg CO2e/h, 0.001 h/t - CODI 59c

h) LÍMITS NORMATIUS:
   - MBC_convencional: 70.0 kg CO2e/t
   - MBC_amb_RA: 60.0 kg CO2e/t
   - MBT: 55.0 kg CO2e/t
   - AUTL: 45.0 kg CO2e/t

Script executable: npm run seed:emissions
Idempotent amb logs de progrés

ENTREGABLES:
- prisma/seed-emissions.ts amb TOTES les dades (60 registres)
- package.json scripts actualitzats
- Validació de dades inserides
```

### Prompts 2.5, 2.6, 2.7: Gestió, Importació/Exportació i Validació d'Emissions

```
[Contingut igual que l'anterior document de prompts]
```

### Prompt 2.8: Georeferenciació i Mapes

```
Integra mapes interactius per a georeferenciació.

REQUISITS:
1. Frontend:
   - Integrar Leaflet
   - Component MapaProjecte (seleccionar ubicació)
   - Component MapaUbicacions (mostrar múltiples)
   - Component SelectorRuta

2. Backend:
   - Model Ubicacio
   - Endpoints CRUD
   - Service gis.service.ts amb OpenRouteService

3. Funcionalitats:
   - Clic al mapa per seleccionar
   - Cercador d'adreces
   - Càlcul de distàncies

ENTREGABLES:
- Frontend: MapaProjecte.tsx, MapaUbicacions.tsx, SelectorRuta.tsx
- Backend: ubicacions.controller.ts, gis.service.ts
```

### Prompt 2.8b: Gestió d'Ubicacions amb Modal i APIs (NOU)

```
Implementa la gestió d'ubicacions amb modal i integració d'APIs de dades obertes.

REQUISITS:

1. Backend:
   
   Model Ubicacio ampliat:
   - id, nom, tipus (planta_asfalt, pedrera, fabrica_betum, etc.)
   - adreca completa, coordenades (lat, lng)
   - contacte, horari, capacitat_produccio
   - materials_produits: array
   - actiu, es_public, font_dades, external_id
   
   Endpoints:
   - CRUD complet
   - GET /ubicacions/nearby?lat=X&lng=Y&radius=Km
   - POST /ubicacions/importar-externes
   
   Integració APIs:
   
   a) OpenStreetMap (Overpass API):
      - URL: https://overpass-api.de/api/interpreter
      - Queries per pedreres, plantes d'asfalt, fàbriques
      - Service: osm.service.ts
   
   b) ICGC (Catalunya):
      - URL: https://www.icgc.cat/
      - Dades de pedreres oficials
      - Service: icgc.service.ts
   
   c) OpenRouteService (rutes):
      - URL: https://api.openrouteservice.org/
      - Càlcul de distàncies per carretera
      - Service: distancies.service.ts

2. Frontend:
   
   Component ModalUbicacions:
   - Modal a pantalla completa o gran (no contaminar estètica)
   - Layout 3 columnes:
     * Col 1: Llista amb cercador i filtres
     * Col 2: Mapa interactiu
     * Col 3: Detall de seleccionada
   
   Filtres:
   - Per tipus (planta, pedrera, etc.)
   - Per material produït
   - Per distància màxima
   
   SelectorUbicacioMapa:
   - Mapa centrat a l'obra
   - Cercle amb radi configurable (50km per defecte)
   - Marcadors de colors segons tipus:
     * 🟢 Verd: Planta d'asfalt
     * 🟤 Marró: Pedrera
     * ⚫ Negre: Fàbrica de betum
     * 🔵 Blau: Fàbrica d'additius
     * 🔴 Vermell: Obra actual
   
   ImportarUbicacionsExternes:
   - Selector d'API font (OSM, ICGC)
   - Preview de resultats
   - Importació massiva

3. Càlcul automàtic de distàncies:
   - Distància lineal (Haversine)
   - Distància per carretera (ORS)
   - Emmagatzemar ambdues
   - Actualitzar emissions automàticament

4. Seed d'exemple:
   - 3-5 plantes d'asfalt
   - 5-10 pedreres
   - 2-3 fàbriques de betum

ENTREGABLES:
- Backend: ubicacions.controller.ts, osm.service.ts, icgc.service.ts, distancies.service.ts
- Frontend: ModalUbicacions.tsx, SelectorUbicacioMapa.tsx, ImportarUbicacionsExternes.tsx
- Seed: seed-ubicacions-exemple.ts
- Documentació: APIS_DADES_OBERTES_UBICACIONS.md
```

---

## FASES 3-9: [Continuar amb els prompts restants igual que l'anterior document]

Els prompts 3.1, 3.2, 4.1, 4.2, 5.1, 5.2, 6.1, 6.2, 7.1, 7.2, 8.1, 8.2, 9.1, 9.2 romanen iguals que al document anterior.

---

**TOTAL: 27 PROMPTS**
