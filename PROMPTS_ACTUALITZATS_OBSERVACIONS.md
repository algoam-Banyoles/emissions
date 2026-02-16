# PROMPTS ACTUALITZATS - OBSERVACIONS DE L'USUARI

## OBSERVACIÓ 1: CÀLCUL AUTOMÀTIC DE CATEGORIA DE TRÀNSIT

### Prompt Modificat 2.1: CRUD de Projectes (amb Càlcul de Categoria de Trànsit)

```
Implementa la gestió completa de projectes amb càlcul automàtic de categoria de trànsit.

REQUISITS:
1. Backend:
   - Model Projecte amb camps:
     * imd: Intensitat mitjana diària (vehicles/dia)
     * percentatge_vp: Percentatge de vehicles pesants (%)
     * categoria_transit_auto: String (calculat automàticament)
     * categoria_transit_manual: String (opcional, seleccionat per usuari)
     * usa_categoria_manual: Boolean (indica si usa selecció manual)
   
   - Funció calcularCategoriaTransit(IMD, %VP): string
     * Retorna la categoria segons la taula del PG-3:
       
       CATEGORIA | IMD (veh/dia) | %VP
       ----------|---------------|-----
       TT1       | < 150         | < 10%
       TT2       | 150-1500      | 10-20%
       TT3       | 1500-6000     | 15-25%
       TT4       | 6000-15000    | 20-30%
       TT5       | > 15000       | > 25%
       
     * Si IMD i %VP no encaixen exactament, retorna la categoria més restrictiva
     * Si l'usuari ha seleccionat manualment, usa categoria_transit_manual
   
   - Endpoint GET /projects/:id/categoria-transit
     * Retorna la categoria calculada i la manual (si existeix)
     * Indica quina s'està utilitzant

2. Frontend:
   - Formulari de projecte amb:
     * Camp IMD (numèric)
     * Camp %VP (numèric, 0-100)
     * Checkbox "Seleccionar categoria manualment"
     * Selector de categoria (TT1, TT2, TT3, TT4, TT5) - només visible si checkbox activat
     * Display de categoria calculada automàticament (actualitzat en temps real)
   
   - Component CategoriaTransitDisplay:
     * Mostra la categoria actual (auto o manual)
     * Indicador visual de si és manual o automàtica
     * Explicació de la categoria (rang d'IMD i %VP)

3. Validacions:
   - IMD >= 0
   - 0 <= %VP <= 100
   - Si manual, categoria ha de ser TT1-TT5

ENTREGABLES:
- Backend: projects.service.ts amb funció de càlcul
- Frontend: ProjectForm.tsx amb lògica de càlcul en temps real
- Component CategoriaTransitDisplay.tsx
- Tests per a la funció de càlcul
```

---

## OBSERVACIÓ 2: TIPUS D'ESPLANADA I SECCIONS (DETALL COMPLET DE LA NORMATIVA)

### Prompt Nou 2.2b: Base de Dades d'Esplanades i Seccions (Normativa 6.1 IC)

```
Crea la base de dades completa d'esplanades i seccions segons la Norma 6.1 IC.

NOTA IMPORTANT: Aquesta informació ve directament de la normativa 6.1 IC i el PG-3.
NO s'ha d'extreure d'internet, sinó usar EXACTAMENT aquestes dades.

REQUISITS:

1. Model TipusEsplanada:
   - id, codi, nom, descripcio
   - resistencia_minima_mpa
   - coeficient_reaccio_k
   - categoria_transit_permesa: array de categories (TT1-TT5)

2. Dades inicials (SEED) - 5 tipus d'esplanada:
   
   a) ESPLANADA TIPO I (Roca molt bona):
      - Codi: E1
      - Nom: "Roca de molt bona qualitat"
      - Resistència: > 100 MPa
      - Coeficient K: > 100 MN/m³
      - Categories permeses: TT1, TT2, TT3, TT4, TT5
      - Descripció: Roca sana, sense alteració, amb Rc > 100 MPa
   
   b) ESPLANADA TIPO II (Roca bona):
      - Codi: E2
      - Nom: "Roca de bona qualitat"
      - Resistència: 50-100 MPa
      - Coeficient K: 50-100 MN/m³
      - Categories permeses: TT1, TT2, TT3, TT4, TT5
      - Descripció: Roca amb Rc entre 50 i 100 MPa
   
   c) ESPLANADA TIPO III (Roca mitjana):
      - Codi: E3
      - Nom: "Roca de qualitat mitjana"
      - Resistència: 25-50 MPa
      - Coeficient K: 25-50 MN/m³
      - Categories permeses: TT1, TT2, TT3, TT4
      - Descripció: Roca amb Rc entre 25 i 50 MPa
   
   d) ESPLANADA TIPO IV (Sòls granulars):
      - Codi: E4
      - Nom: "Sòls granulars (grava, sorra)"
      - Resistència: 5-25 MPa
      - Coeficient K: 10-25 MN/m³
      - Categories permeses: TT1, TT2, TT3
      - Descripció: Sòls granulars compactats, IP < 15%
   
   e) ESPLANADA TIPO V (Sòls fins):
      - Codi: E5
      - Nom: "Sòls fins (limos, argiles)"
      - Resistència: < 5 MPa
      - Coeficient K: < 10 MN/m³
      - Categories permeses: TT1, TT2
      - Descripció: Sòls fins, IP > 15%, necessiten tractament

3. Model SeccioTipus (tipus de seccions permeses per combinació):
   - id, codi, nom
   - categoria_transit: array (TT1-TT5)
   - tipus_esplanada: array (E1-E5)
   - capes_permeses: array (CR, CI, CB, CS)
   - descripcio

4. Dades inicials (SEED) - Seccions segons norma 6.1 IC:
   
   COMBINACIÓ CATEGORIA + ESPLANADA → SECCIONS PERMESES:
   
   Per a TT1-TT2 (Trànsit lleuger):
   - E1, E2, E3, E4, E5 → Seccions: CR+CI+CB, CR+CI+CB+CS, CR+CB+CS
   
   Per a TT3 (Trànsit mitjà):
   - E1, E2, E3, E4 → Seccions: CR+CI+CB, CR+CI+CB+CS
   - E5 → Seccions: CR+CI+CB+CS (obligatori subbase)
   
   Per a TT4 (Trànsit pesat):
   - E1, E2, E3 → Seccions: CR+CI+CB, CR+CI+CB+CS
   - E4, E5 → Seccions: CR+CI+CB+CS (obligatori subbase)
   
   Per a TT5 (Trànsit molt pesat):
   - E1, E2 → Seccions: CR+CI+CB, CR+CI+CB+CS
   - E3, E4, E5 → Seccions: CR+CI+CB+CS (obligatori subbase)

5. Model combinacions:
   - CombinacioEsplanadaSeccio:
     * id, tipus_esplanada_id, categoria_transit, seccio_tipus_id
     * viable: boolean
     * observacions

6. Frontend:
   - SelectorTipusEsplanada:
     * Dropdown amb els 5 tipus d'esplanada
     * Descripció detallada de cada tipus
     * Indicador de categories de trànsit permeses
   
   - DisplaySeccionsPermeses:
     * Mostra les seccions disponibles per la combinació seleccionada
     * Indica quines capes són obligatòries
     * Visualització gràfica de les seccions

7. Seed script:
   - Inserir tots els tipus d'esplanada
   - Inserir totes les combinacions vàlides
   - Validar consistència

ENTREGABLES:
- Models Prisma: TipusEsplanada, SeccioTipus, CombinacioEsplanadaSeccio
- Seed: seed-esplanades.ts amb TOTES les dades
- Frontend: SelectorTipusEsplanada.tsx, DisplaySeccionsPermeses.tsx
- Service: esplanades.service.ts
- Tests de validació
```

---

## OBSERVACIÓ 3: TIPOLOGIES DE PROJECTE

Els tipus de projecte estan correctament definits:
- ✅ Nova construcció (Norma 6.1 IC)
- ✅ Reforç (Norma 6.3 IC)
- ✅ Reciclatge (OC 2023-02)
- ✅ AUTL (OC 2022-03)

No cal modificar res aquí.

---

## OBSERVACIÓ 4: CONFIGURACIÓ EXPLÍCITA DE POSTGRESQL I SEED

### Prompt Modificat 1.2: Backend Base i Base de Dades (amb Configuració PostgreSQL)

```
Crea el backend base amb Node.js, Express i PostgreSQL, configurant EXPLÍCITAMENT la base de dades.

REQUISITS:

1. Inicialitzar projecte Node.js:
   - npm init -y
   - Instal·lar TypeScript: npm install -D typescript @types/node ts-node
   - Configurar tsconfig.json amb:
     * target: ES2020
     * module: commonjs
     * strict: true
     * outDir: ./dist
     * rootDir: ./src

2. Instal·lar dependències:
   - npm install express @types/express
   - npm install prisma @prisma/client
   - npm install dotenv helmet cors compression morgan
   - npm install bcryptjs jsonwebtoken @types/bcryptjs @types/jsonwebtoken
   - npm install zod
   - npm install winston

3. Configurar PostgreSQL EXPLÍCITAMENT:
   
   a) Crear fitxer .env amb:
      ```
      # Database Configuration
      DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/calculadora_firmes?schema=public"
      
      # JWT Configuration
      JWT_SECRET="your-secret-key-here"
      JWT_REFRESH_SECRET="your-refresh-secret-here"
      
      # Server Configuration
      PORT=3001
      NODE_ENV=development
      
      # Frontend URL (per CORS)
      FRONTEND_URL="http://localhost:5173"
      ```
   
   b) Crear script de configuració setup-database.sh:
      ```bash
      #!/bin/bash
      echo "Configurant base de dades PostgreSQL..."
      echo "Introdueix la contrasenya de PostgreSQL:"
      read -s DB_PASSWORD
      
      # Crear base de dades
      PGPASSWORD=$DB_PASSWORD psql -U postgres -c "CREATE DATABASE calculadora_firmes;"
      
      # Crear usuari (opcional)
      PGPASSWORD=$DB_PASSWORD psql -U postgres -c "CREATE USER firmes_user WITH PASSWORD 'firmes_password';"
      PGPASSWORD=$DB_PASSWORD psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE calculadora_firmes TO firmes_user;"
      
      echo "Base de dades creada correctament!"
      ```
   
   c) Instruccions detallades a README.md:
      ```markdown
      ## Configuració de la Base de Dades
      
      ### Opció 1: PostgreSQL Local
      1. Instal·la PostgreSQL 14+
      2. Executa: `./setup-database.sh`
      3. Edita .env amb les teves credencials
      
      ### Opció 2: Docker
      ```bash
      docker run --name postgres-firmes \
        -e POSTGRES_PASSWORD=yourpassword \
        -e POSTGRES_DB=calculadora_firmes \
        -p 5432:5432 \
        -d postgres:14
      ```
      
      ### Opció 3: PostgreSQL a AWS/Railway/Supabase
      1. Crea una instància
      2. Copia la DATABASE_URL
      3. Pega-la al fitxer .env
      ```

4. Configurar Prisma:
   - npx prisma init
   - Configurar schema.prisma amb:
     * provider: "postgresql"
     * url: env("DATABASE_URL")
   
5. Crear models inicials:
   - Organitzacio (id, nom, tipus, nif, createdAt)
   - Usuari (id, email, nom, cognoms, passwordHash, rol, organitzacioId, createdAt)
   - Projecte (id, nom, descripcio, imd, percentatgeVp, categoriaTransit, tipusEsplanadaId, createdAt)
   - VersioBaseDades (id, numero, descripcio, dataPublicacio, esActual)

6. Configurar scripts a package.json:
   ```json
   {
     "scripts": {
       "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
       "build": "tsc",
       "start": "node dist/app.ts",
       "db:migrate": "prisma migrate dev",
       "db:generate": "prisma generate",
       "db:studio": "prisma studio",
       "db:seed": "ts-node prisma/seed.ts",
       "db:seed:emissions": "ts-node prisma/seed-emissions.ts",
       "db:seed:esplanades": "ts-node prisma/seed-esplanades.ts",
       "db:reset": "prisma migrate reset && npm run db:seed"
     }
   }
   ```

7. Crear estructura de carpetes:
   ```
   backend/
   ├── src/
   │   ├── config/
   │   │   ├── database.ts       # Configuració Prisma
   │   │   ├── env.ts            # Validació variables d'entorn
   │   │   └── logger.ts         # Configuració Winston
   │   ├── controllers/
   │   ├── middlewares/
   │   ├── routes/
   │   ├── services/
   │   ├── types/
   │   └── utils/
   ├── prisma/
   │   ├── schema.prisma
   │   ├── seed.ts               # Seed general
   │   ├── seed-emissions.ts     # Seed emissions (Prompt 2.4)
   │   └── seed-esplanades.ts    # Seed esplanades (Prompt 2.2b)
   ├── .env
   ├── .env.example
   ├── setup-database.sh
   └── package.json
   ```

8. Implementar seed.ts inicial:
   - Crear versió base de dades "2024.0"
   - Crear usuari admin per defecte
   - Logs de progrés

9. Documentació:
   - README.md amb instruccions pas a pas
   - COMANDES.md amb comandes útils
   - TROUBLESHOOTING.md amb problemes comuns

ENTREGABLES:
- package.json complet
- tsconfig.json configurat
- prisma/schema.prisma amb models inicials
- .env i .env.example
- setup-database.sh executable
- src/config/database.ts
- src/config/env.ts (validació amb Zod)
- prisma/seed.ts
- README.md amb instruccions detallades
```

---

## OBSERVACIÓ 5: ASSIGNACIÓ D'UBICACIONS (MILLORA)

### Prompt Nou 2.8b: Gestió d'Ubicacions amb Modal i API de Dades Obertes

```
Implementa la gestió d'ubicacions (plantes, pedreres, fàbriques) amb modal i integració d'APIs de dades obertes.

REQUISITS:

1. Backend:
   
   a) Model Ubicacio ampliat:
      - id, nom, tipus (planta_asfalt, pedrera, fabrica_betum, fabrica_additius, obra)
      - adreca completa (carrer, ciutat, cp, provincia, pais)
      - coordenades (latitud, longitud)
      - contacte (telefon, email)
      - horari
      - capacitat_produccio (opcional)
      - materials_produits: array (tipus de materials)
      - actiu: boolean
      - es_public: boolean (si és d'una API pública)
      - font_dades (ex: "ICGC", "Ministeri", etc.)
      - external_id (ID a la font original)
   
   b) Endpoints:
      - CRUD complet per a ubicacions
      - GET /ubicacions/nearby?lat=X&lng=Y&radius=Km (ubicacions properes)
      - GET /ubicacions/by-material/:materialId (ubicacions que produeixen un material)
      - POST /ubicacions/importar-externes (importar des d'APIs)
   
   c) Integració amb APIs de dades obertes:
      
      API 1: ICGC (Institut Cartogràfic i Geològic de Catalunya)
      - URL: https://www.icgc.cat/
      - Dades: Pedreres, extraccions
      - Implementar: icgc.service.ts
      
      API 2: Ministeri de Transició Ecològica (Registre de residus)
      - URL: https://www.miteco.gob.es/
      - Dades: Plantes de tractament, reciclatge
      - Implementar: miteco.service.ts
      
      API 3: OpenStreetMap / Overpass API
      - URL: https://overpass-api.de/
      - Dades: Quarries, industrial plants
      - Query exemple:
        ```
        [out:json];
        area["name"="Catalunya"]->.searchArea;
        (
          node["industry"="quarry"](area.searchArea);
          way["industry"="quarry"](area.searchArea);
        );
        out center;
        ```
      
      API 4: Google Places API (alternativa)
      - Cercar "pedrera", "planta d'asfalt", etc.
      - Requereix API key

2. Frontend:
   
   a) Component ModalUbicacions:
      - Modal a pantalla completa o gran
      - Layout en 3 columnes:
        * Columna 1: Llista d'ubicacions (cercador, filtres)
        * Columna 2: Mapa interactiu
        * Columna 3: Detall de la ubicació seleccionada
      
      - Filtres:
        * Per tipus (planta, pedrera, etc.)
        * Per material produït
        * Per distància màxima
        * Per actiu/inactiu
      
      - Accions:
        * Afegir nova ubicació manualment
        * Importar des d'API externa
        * Editar ubicació existent
        * Eliminar (lògic)
        * Seleccionar per al projecte
   
   b) Component SelectorUbicacioMapa:
      - Mapa centrat a la ubicació de l'obra
      - Cercle amb radi configurable (per defecte 50km)
      - Marcadors de diferents colors segons tipus:
        * 🟢 Verd: Planta d'asfalt
        * 🟤 Marró: Pedrera
        * ⚫ Negre: Fàbrica de betum
        * 🔵 Blau: Fàbrica d'additius
        * 🔴 Vermell: Obra actual
      
      - Al fer clic a un marcador:
        * Mostra info (nom, distància, materials)
        * Botó "Seleccionar"
        * Botó "Veure detall"
   
   c) Component ImportarUbicacionsExternes:
      - Selector d'API font (ICGC, Miteco, OSM)
      - Filtres per tipus de ubicació
      - Preview de resultats abans d'importar
      - Mapeig de camps (ex: "nom" → "nom")
      - Botó "Importar seleccionades"
      - Barra de progrés

3. Càlcul automàtic de distàncies:
   - Quan s'assigna una ubicació a un projecte:
     * Calcular distància lineal (Haversine)
     * Calcular distància per carretera (OpenRouteService)
     * Emmagatzemar ambdues distàncies
     * Actualitzar emissions automàticament
   
   - Service distancies.service.ts:
     * calcularDistanciaLineal(p1, p2): km
     * calcularDistanciaCarretera(p1, p2): km + geometria
     * calcularTempsRecorregut(p1, p2): minuts

4. Seed d'ubicacions d'exemple:
   - 3-5 plantes d'asfalt (Barcelona, Madrid, València)
   - 5-10 pedreres (diferents províncies)
   - 2-3 fàbriques de betum
   - Coordenades reals

5. Documentació:
   - GUIO_UBICACIONS.md amb instruccions d'ús
   - LLISTA_APIS.md amb enllaços i documentació

ENTREGABLES:
- Backend: ubicacions.controller.ts, ubicacions.service.ts
- Services: icgc.service.ts, miteco.service.ts, osm.service.ts, distancies.service.ts
- Frontend: ModalUbicacions.tsx, SelectorUbicacioMapa.tsx, ImportarUbicacionsExternes.tsx
- Seed: seed-ubicacions-exemple.ts
- Documentació: GUIO_UBICACIONS.md, LLISTA_APIS.md
```

---

## RESUM DE CANVIS

| Observació | Prompt Afectat | Acció |
|------------|----------------|-------|
| 1. Càlcul categoria trànsit | 2.1 | Modificar - afegir càlcul automàtic + manual |
| 2. Tipus esplanada i seccions | NOU 2.2b | Crear nou prompt amb TOTA la normativa detallada |
| 3. Tipologies | - | Correcte, sense canvis |
| 4. Configuració PostgreSQL | 1.2 | Modificar - afegir setup explícit, .env, scripts |
| 5. Ubicacions amb modal i APIs | NOU 2.8b | Crear nou prompt amb modal i integració APIs |

**Total prompts**: 25 + 2 nous = **27 prompts**
