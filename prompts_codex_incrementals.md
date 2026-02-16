# PROMPTS INCREMENTALS PER DESENVOLUPAR AMB CODEX (VS CODE)

## INSTRUCCIONS GENERALS PER A TOTS ELS PROMPTS

```
Ets un desenvolupador expert en aplicacions web modernes amb:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- Backend: Node.js + Express + TypeScript + PostgreSQL + Prisma ORM
- APIs: GraphQL (Apollo) o REST segons el context
- Testing: Jest + React Testing Library + Playwright
- Eines: ESLint, Prettier, Husky per a git hooks

Segueix les millors pràctiques:
- Codi net i mantenible (Clean Code)
- Principis SOLID
- Patrons de disseny quan sigui necessari
- Documentació inline per a funcions complexes
- Gestió d'errors robusta
- Validació d'entrades amb Zod
- Tipatge estricte de TypeScript (no usar 'any')

Estructura del codi:
- Separar clarament presentació, lògica de negoci i accés a dades
- Usar hooks personalitzats per a lògica reutilitzable
- Components petits i enfocats
- Serveis per a crides API
- Utils per a funcions purament funcionals
```

---

## FASE 1: ESTRUCTURA BASE I AUTENTICACIÓ

### Prompt 1.1: Inicialització del Projecte

```
Crea l'estructura base d'una aplicació SaaS multi-tenant per a optimització de ferms i certificats ambientals.

REQUISITS:
1. Inicialitza un projecte amb Vite + React 18 + TypeScript
2. Configura Tailwind CSS amb tema personalitzat (colors corporatius: blau fosc #1e3a5f, verd #2d8a4e, gris #f5f5f5)
3. Instal·la i configura shadcn/ui amb components base
4. Configura ESLint + Prettier amb regles estrictes
5. Configura Husky per a pre-commit hooks (lint + type-check)
6. Crea l'estructura de carpetes:
   - src/
     - components/ (ui/, forms/, layout/)
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
- Estructura de carpetes creada
- README.md amb instruccions d'instal·lació
```

### Prompt 1.2: Backend Base i Base de Dades

```
Crea el backend base amb Node.js, Express i PostgreSQL.

REQUISITS:
1. Inicialitza projecte Node.js amb TypeScript
2. Configura Express amb middlewares essencials (helmet, cors, compression, morgan)
3. Configura Prisma ORM amb PostgreSQL
4. Crea l'esquema inicial de la base de dades (veure especificació):
   - Organitzacio
   - Usuari
   - Projecte (bàsic)
   - VersioBaseDades
5. Implementa migracions inicials
6. Configura variables d'entorn amb dotenv
7. Crea estructura de carpetes:
   - src/
     - config/
     - controllers/
     - middlewares/
     - models/ (Prisma)
     - routes/
     - services/
     - utils/
     - types/

ENTREGABLES:
- package.json amb dependències
- prisma/schema.prisma amb models inicials
- src/app.ts amb Express configurat
- src/config/database.ts amb connexió Prisma
- .env.example amb variables necessàries
```

### Prompt 1.3: Sistema d'Autenticació

```
Implementa el sistema d'autenticació complet amb JWT i refresh tokens.

REQUISITS:
1. Backend:
   - Endpoint POST /auth/register (crear usuari i organització)
   - Endpoint POST /auth/login (autenticar i retornar tokens)
   - Endpoint POST /auth/refresh (renovar access token)
   - Endpoint POST /auth/logout (invalidar tokens)
   - Middleware de verificació JWT
   - Hash de contrasenyes amb bcrypt
   - Rate limiting per a intents de login

2. Frontend:
   - Pàgina de login (/login)
   - Pàgina de registre (/register)
   - Formularis amb validació Zod
   - Gestió d'estat d'autenticació amb Zustand
   - Interceptor d'Axios per a afegir token i renovar automàticament
   - Protected routes (React Router)
   - Logout

3. Seguretat:
   - Tokens JWT amb expiració curta (15 min)
   - Refresh tokens amb expiració llarga (7 dies)
   - Emmagatzematge segur (httpOnly cookies per a refresh)
   - Validació de fortalesa de contrasenya

ENTREGABLES:
- Backend: auth.controller.ts, auth.service.ts, auth.routes.ts, auth.middleware.ts
- Frontend: Login.tsx, Register.tsx, useAuth.ts, auth.store.ts, ProtectedRoute.tsx
- Tests unitaris per a serveis d'autenticació
```

---

## FASE 2: GESTIÓ DE PROJECTES I DADES MESTRES

### Prompt 2.1: CRUD de Projectes

```
Implementa la gestió completa de projectes.

REQUISITS:
1. Backend:
   - CRUD endpoints per a Projecte:
     - GET /projects (llistar, amb paginació i filtres)
     - POST /projects (crear)
     - GET /projects/:id (detall)
     - PUT /projects/:id (actualitzar)
     - DELETE /projects/:id (eliminar)
   - Validació de dades amb Zod
   - Autorització: només usuaris de la mateixa organització

2. Frontend:
   - Pàgina de llista de projectes (/projects)
     - Taula amb paginació
     - Filtres per estat, data, nom
     - Botó per crear nou projecte
   - Pàgina de detall de projecte (/projects/:id)
     - Visualització de totes les dades
     - Edició inline
     - Històric d'activitats
   - Modal per crear/editar projecte
     - Formulari amb tots els camps
     - Validació en temps real
     - Guardar com a esborrany

3. Camps del projecte (fase 1):
   - Nom, descripció, codi
   - Dades del trànsit (IMD, %VP, tipus traçat, zona climàtica)
   - Vida útil, creixement anual
   - Ubicació (coordenades GPS)
   - Estat (esborrany, actiu, completat, arxiuat)

ENTREGABLES:
- Backend: projects.controller.ts, projects.service.ts, projects.routes.ts
- Frontend: ProjectsList.tsx, ProjectDetail.tsx, ProjectForm.tsx, useProjects.ts
- Tests d'integració
```

### Prompt 2.2: Gestió de Materials i Base de Dades Mestra

```
Implementa la gestió de materials i el sistema de versions de la base de dades.

REQUISITS:
1. Backend:
   - Model Material amb totes les propietats (estructurals i ambientals)
   - Endpoints CRUD per a materials (només admin)
   - Sistema de versions:
     - Model VersioBaseDades
     - Endpoint per publicar nova versió
     - Endpoint per llistar versions
     - Endpoint per canviar versió activa
   - Importació CSV/Excel:
     - Endpoint POST /admin/importar-preus
     - Processament de fitxers CSV
     - Validació de dades
     - Creació de nova versió

2. Frontend (només per a admin):
   - Pàgina de gestió de materials (/admin/materials)
     - Taula editable
     - Editor de propietats
   - Pàgina de versions (/admin/versions)
     - Llista de versions
     - Botó per publicar nova versió
     - Comparativa entre versions
   - Modal per importar fitxers
     - Drag & drop de CSV/Excel
     - Preview de dades abans d'importar
     - Validació d'errors

3. Seguretat:
   - Middleware de verificació de rol admin
   - Logs d'auditoria per a canvis en materials

ENTREGABLES:
- Backend: materials.controller.ts, materials.service.ts, versions.service.ts, import.service.ts
- Frontend: MaterialsAdmin.tsx, VersionsAdmin.tsx, ImportModal.tsx
- Tests per a importació de fitxers
```

### Prompt 2.3: Base de Dades d'Emissions - Estructura i Models

```
Crea l'estructura completa de la base de dades d'emissions segons l'OC 3/2024.

REQUISITS:
1. Models Prisma per a emissions:
   
   a) FactorEmissioMaterial (A1 - Producció):
      - id, codi_material, nom, categoria
      - factor_emissio (kg CO2e/unitat)
      - unitat (kg, t, m3, etc.)
      - font_dades (DAP SEVE, MITERD, etc.)
      - any_referencia, versio_dap
      - incertesa_percentatge
      - actiu, data_creacio, data_actualitzacio
   
   b) FactorEmissioTransport (A2/A4 - Transport):
      - id, tipus_vehicle, capacitat_tonelades
      - factor_emissio (kg CO2e/t·km)
      - font_dades, any_referencia
      - combustible (gasoleo, fueloleo, gas_natural)
      - actiu
   
   c) ConstantCalorifica (A3 - Fabricació):
      - id, nom_material, calor_especific (kJ/kg·K)
      - font_dades, temperatura_referencia
      - actiu
   
   d) CombustibleFabricacio (A3):
      - id, nom_combustible, poder_calorific_inferior (MJ/kg o MJ/GJ)
      - factor_emissio (kg CO2e/unitat)
      - font_dades, any_referencia
      - actiu
   
   e) ConsumElectric (A3):
      - id, tipus_consum (motors_central, calentament_ligants, etc.)
      - consum_kwh_per_tona
      - factor_emissio_red (kg CO2e/kWh)
      - factor_emissio_grupo (kg CO2e/kWh)
      - font_dades, any_referencia
      - actiu
   
   f) EquipPosadaEnObra (A5):
      - id, nom_equip, tipus
      - factor_emissio (kg CO2e/h)
      - rendiment_hores_per_tona
      - font_dades
      - actiu
   
   g) LimitNormatiuEmissions:
      - id, tipologia_mescla (MBC, MBT, AUTL, etc.)
      - etapa (A1_A5, A1, A3, etc.)
      - valor_limit (kg CO2e/t)
      - font_normativa (OC 3/2024)
      - data_entrada_vigor
      - actiu

2. Relacions entre models:
   - VersioBaseDades pot tenir múltiples factors d'emissió
   - Cada factor pertany a una versió específica
   - Traçabilitat de canvis

3. Índexos per a consultes ràpides:
   - Índex per codi_material + versio
   - Índex per categoria + actiu
   - Índex per tipus_vehicle + actiu

4. Validacions:
   - Factors d'emissió >= 0 (excepte crèdits que poden ser negatius)
   - Unitats consistents
   - Fonts de dades obligatòries

ENTREGABLES:
- prisma/schema.prisma amb tots els models d'emissions
- Migracions Prisma
- Seed script bàsic per crear taules
- Documentació de l'estructura de dades
```

### Prompt 2.4: Seed de Base de Dades d'Emissions (Dades Inicials COMPLETES)

```
Crea el seed de la base de dades amb TOTS els factors d'emissió oficials de l'OC 3/2024 i l'Excel EFAPAVE.

REQUISITS:
1. Script de seed (prisma/seed-emissions.ts) que insereixi TOTES les dades:

   a) FACTORS D'EMISSIÓ A1 (Producció de materials) - 26 materials:
      // Àrids (codis 10a, 10b, 11a, 11b)
      - arido_natural: 4.48 kg CO2e/t (DAP FdA AN, 2022) - CODI 10a/11a
      - arido_siderurgico: 3.69 kg CO2e/t (DAP FdA AA, 2022) - CODI 10b/11b
      
      // Pols mineral (codis 12a, 12b, 12c)
      - polvo_caco3: 4.48 kg CO2e/t (DAP FdA AN, 2022) - CODI 12a
      - polvo_caoh2: 300.32 kg CO2e/t (DAP EULA, 2024) - CODI 12b
      - polvo_cemento: 427.8 kg CO2e/t (DAP IECA CEM III, 2023) - CODI 12c
      
      // RA - Reutilització d'asfalt (codi 13)
      - RA_tratado: 2.16 kg CO2e/t (DAP FdA AN, 2023) - CODI 13
      
      // Betums (codis 14a, 14b, 14c, 14d)
      - betun_convencional: 272.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14a
      - betun_PNFVU: 254.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14b
      - betun_PMB: 465.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14c
      - betun_PMB_caucho: 359.5 kg CO2e/t (Deducció híbrida) - CODI 14d
      
      // Emulsions bituminoses (codis 14e, 14f, 14g, 14h)
      - emulsion_C60B4: 227.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14e
      - emulsion_C65B4: 227.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14f
      - emulsion_C60B5: 227.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14g
      - emulsion_C65B5: 227.0 kg CO2e/t (DAP REPSOL, 2020) - CODI 14h
      
      // Fibras i aditius (codis 15, 17)
      - fibras_celulosa: 229.0 kg CO2e/t (LCA TOPCEL, CFF) - CODI 15
      - aditivo_semicalefacto: 1190.0 kg CO2e/t (SEVE V4.0, 2022) - CODI 17
      
      // RARx - Pols de neumàtics (codis 16a, 16b, 16c) - CRÈDITS!
      - RARx_caco3: -141.0 kg CO2e/t (DAP CIRTEC, 2024) - CODI 16a
      - RARx_caoh2: -59.6 kg CO2e/t (DAP CIRTEC, 2024) - CODI 16b
      - RARx_tyrexol: -1060.3 kg CO2e/t (Draft EPD RENECAL, 2025) - CODI 16c
      
      // PVC (codi 18) - PENDIENTE DE ASIGNAR VALOR
      - PVC_filler: 0.0 kg CO2e/t (Pendiente de asignar valor e indicar fuente) - CODI 18
      
      // Conglomerants hidràulics (codis 19a, 19b, 19c, 19d)
      - cal_hidratada: 892.0 kg CO2e/t (EULA, 2024) - CODI 19a
      - cemento_CEM_I: 778.0 kg CO2e/t (DAP IECA, 2023) - CODI 19b
      - cemento_CEM_II: 649.8 kg CO2e/t (DAP IECA, 2023) - CODI 19c
      - cemento_CEM_III: 427.8 kg CO2e/t (DAP IECA, 2023) - CODI 19d
   
   b) FACTORS DE TRANSPORT (A2/A4) - 3 vehicles (codis 20/40, 21, 22):
      - camion_semirremolque_40t_bascualnte: 0.0849 kg CO2e/t·km (SEVE V4.0, 2022) - CODI 20/40
        * Capacitat: 28 t de càrrega útil
        * Us: Àrids, RA i mescla bituminosa
      - camion_rigido_18t: 0.17 kg CO2e/t·km (SEVE V4.0, 2022) - CODI 21
        * Capacitat: 9 t de càrrega útil
        * Us: Fibras, PNFVU i aditius
      - camion_cisterna_40t: 0.0881 kg CO2e/t·km (SEVE V4.0, 2022) - CODI 22
        * Capacitat: 24 t de càrrega útil
        * Us: Betum i pols mineral
   
   c) CONSTANTS CALORÍFIQUES (A3) - 6 constants:
      - aridos_naturales: Ce = 0.835 kJ/kg·K
      - arido_siderurgico: Ce = 0.78 kJ/kg·K
      - betun: Ce = 2.093 kJ/kg·K
      - RA: Ce = 0.89161 kJ/kg·K
      - aigua: Ce = 4.184 kJ/kg·K
      - calor_vaporitzacio: C_W = 2.25 MJ/kg
   
   d) COMBUSTIBLES (A3) - 3 combustibles (codis 31, 32, 33):
      - gasoleo: PCI = 43.0 MJ/kg, FE = 3.17 kg CO2e/kg (SEVE V4.0, 2022) - CODI 31
      - fueloleo: PCI = 40.4 MJ/kg, FE = 93.2 kg CO2e/GJ (Informe Inventaris GEI + Ecoinvent 3.11) - CODI 32
      - gas_natural: PCI = 48.31 MJ/kg, FE = 70.19 kg CO2e/GJ (Informe Inventaris GEI + Ecoinvent 3.12) - CODI 33
   
   e) CONSUM ELÈCTRIC (A3) - 3 fonts (codis 34a, 34b, 34c):
      - motors_central: 1.5 kWh/t, FE_red = 0.283 kg CO2e/kWh (MITERD 2024) - CODI 34b
      - grup_electrogen: FE = 0.84956 kg CO2e/kWh (EPA 2010) - CODI 34a
      - calentament_ligants: 0.5 kWh/t, FE_caldera = 0.94466 kg CO2e/kWh (EPA 2010) - CODI 34c
   
   f) PALA CARREGADORA (A3) - Codi 30:
      - pala_carregadora: rendiment = 0.0129 h/t, FE = 71.78 kg CO2e/h (SEVE Eco-comparateur 4.0) - CODI 30
   
   g) EQUIPS POSADA EN OBRA (A5) - 14 equips (codis 50-59):
      - silo_transferencia: 147.8 kg CO2e/h, 0.008 h/t (SEVE Eco-comparateur 4.0) - CODI 50
      - extendedora: 117.085 kg CO2e/h, 0.008 h/t (SEVE Eco-comparateur 4.0) - CODI 51
      - compactador_tandem_11t: 34.0 kg CO2e/h, 0.008 h/t (SEVE Eco-comparateur 4.0) - CODI 52
      - compactador_tandem_15t: 51.18 kg CO2e/h, 0.004 h/t (SEVE Eco-comparateur 4.0) - CODI 53
      - compactador_neumaticos_35t: 65.8676 kg CO2e/h, 0.004 h/t (Deducció/compactador 21t) - CODI 54
      - minibarredora: 25.043 kg CO2e/h, 0.004 h/t (OC 4/2023) - CODI 55
      - fresadora_2_2m: 266.4 kg CO2e/h, 0.004 h/t (SEVE Eco-comparateur 4.0) - CODI 56
      - fresadora_1m: 124.35714 kg CO2e/h, 0.001 h/t (SEVE Eco-comparateur 4.0) - CODI 57a
      - fresadora_0_35m: 30.44286 kg CO2e/h, 0.004 h/t (SEVE Eco-comparateur 4.0) - CODI 57b
      - recicladora: 386.9 kg CO2e/h, 0.004 h/t (SEVE Eco-comparateur 4.0) - CODI 58
      - camion_bascualnte_40t: 159.2 kg CO2e/h, 0.001 h/t (SEVE Eco-comparateur 4.0) - CODI 59a
      - camion_3ejes_14t: 122.05714 kg CO2e/h, 0.004 h/t (SEVE Eco-comparateur 4.0) - CODI 59b
      - camion_cisterna_obra: 159.2 kg CO2e/h, 0.001 h/t (SEVE Eco-comparateur 4.0) - CODI 59c
      
      NOTA: També incloure el compactador de neumàtics 21t (55.82 kg CO2e/h, 0.008 h/t) per compatibilitat
   
   h) LÍMITS NORMATIUS (OC 3/2024):
      - MBC_convencional: A1_A5 = 70.0 kg CO2e/t
      - MBC_amb_RA: A1_A5 = 60.0 kg CO2e/t
      - MBT: A1_A5 = 55.0 kg CO2e/t
      - AUTL: A1_A5 = 45.0 kg CO2e/t

2. Estructura del seed:
   - Crear VersioBaseDades inicial:
     * numero: "2024.1"
     * descripcio: "Versió inicial amb factors d'emissió OC 3/2024 i Excel EFAPAVE"
     * data_publicacio: data actual
     * es_actual: true
   
   - Inserir tots els factors amb relació a aquesta versió
   
   - Validacions:
     * Verificar que tots els codis estan presents (26 A1 + 3 A2/A4 + 6 constants + 3 combustibles + 3 elèctric + 1 pala + 14 A5 = 56 registres)
     * Verificar valors numèrics vàlids
     * Verificar fonts de dades completes

3. Script executable:
   - npm run seed:emissions
   - Idempotent (poder executar múltiples vegades sense duplicats)
   - Logs de progrés detallats
   - Validació exhaustiva de dades inserides
   - Missatge de confirmació amb resum

4. Documentació inclosa:
   - Comentaris al codi amb els codis numèrics (10a, 14b, etc.)
   - Fonts de dades per a cada valor
   - Notes sobre crèdits (valors negatius)
   - Observacions sobre valors pendents (PVC)

ENTREGABLES:
- prisma/seed-emissions.ts amb TOTES les dades (56 registres)
- package.json script actualitzat
- Documentació dels valors inserits amb codis numèrics
- Validació que tots els factors estan presents
- Logs de l'execució del seed
```

### Prompt 2.5: Gestió de Factors d'Emissió (Admin)

```
Implementa la interfície d'administració per gestionar factors d'emissió.

REQUISITS:
1. Backend:
   - Endpoints CRUD per a cada tipus de factor:
     - GET /admin/emissions/materials (llistar amb filtres)
     - POST /admin/emissions/materials (crear)
     - PUT /admin/emissions/materials/:id (actualitzar)
     - DELETE /admin/emissions/materials/:id (eliminar lògic)
     - Endpoints similars per transport, combustibles, equips, etc.
   
   - Validacions:
     - Factor d'emissió numèric
     - Font de dades obligatòria
     - Any de referència coherent
     - No duplicats per codi + versió
   
   - Logs d'auditoria:
     - Qui va modificar el factor
     - Quan es va modificar
     - Valors anteriors i nous

2. Frontend (només admin):
   - Pàgina de gestió de factors d'emissió (/admin/emissions)
     - Tabs per categoria: Materials, Transport, Combustibles, Elèctric, Equips, Límits
     - Taula editable amb ordenació i filtres
     - Cercador per nom o codi
     - Indicador de versió activa
   
   - Modal per crear/editar factor:
     - Formulari amb tots els camps
     - Validació en temps real
     - Ajuda contextual (explicació de camps)
     - Preview del factor
   
   - Accions massives:
     - Seleccionar múltiples factors
     - Actualitzar versió
     - Exportar a CSV
   
   - Historial de canvis:
     - Llista de modificacions
     - Comparativa de versions
     - Possibilitat de revertir

3. Seguretat:
   - Només usuaris amb rol "admin_emissions" poden modificar
   - Confirmació per a canvis importants
   - Backup automàtic abans de modificacions massives

ENTREGABLES:
- Backend: emissions-admin.controller.ts, emissions-admin.service.ts, emissions-admin.routes.ts
- Frontend: EmissionsAdmin.tsx, FactorEmissioForm.tsx, HistorialCanvis.tsx
- Tests per a operacions CRUD
```

### Prompt 2.6: Importació/Exportació de Dades d'Emissions

```
Implementa la importació i exportació de factors d'emissió des de CSV/Excel.

REQUISITS:
1. Importació CSV:
   - Endpoint POST /admin/emissions/importar
   - Suport per a formats:
     - CSV amb separador ; o ,
     - Excel (.xlsx)
   
   - Plantilles de importació:
     - Plantilla per a materials (A1)
     - Plantilla per a transport (A2/A4)
     - Plantilla per a combustibles (A3)
     - Plantilla per a equips (A5)
   
   - Procés d'importació:
     1. Validació de format de fitxer
     2. Preview de dades (primeres 10 files)
     3. Validació de cada fila:
        - Camps obligatoris presents
        - Valors numèrics vàlids
        - Fonts de dades reconegudes
        - No duplicats
     4. Detecció d'errors amb missatges clars
     5. Importació en mode "preview" (sense guardar)
     6. Importació definitiva (amb confirmació)
   
   - Creació automàtica de nova versió:
     - La importació crea una nova VersioBaseDades
     - Tots els factors importats pertanyen a aquesta versió
     - Versió anterior es manté per traçabilitat

2. Exportació CSV:
   - Endpoint GET /admin/emissions/exportar
   - Paràmetres:
     - categoria (materials, transport, etc.)
     - versio (per defecte: versió actual)
     - format (csv, xlsx)
   
   - Fitxer exportat inclou:
     - Totes les columnes de la base de dades
     - Metadades (data d'exportació, versió, usuari)
     - Comentaris amb fonts de dades

3. Frontend:
   - Component ImportarEmissions:
     - Drag & drop de fitxers
     - Selector de plantilla
     - Preview de dades
     - Llista d'errors amb indicació de fila
     - Barra de progrés
     - Resum d'importació (correctes, errors, warnings)
   
   - Component ExportarEmissions:
     - Selector de categoria
     - Selector de versió
     - Selector de format
     - Botó de descàrrega

4. Validacions específiques:
   - Factors negatius només permesos per a crèdits (RARx)
   - Unitats consistents (kg CO2e/t, kg CO2e/t·km, etc.)
   - Anys de referència entre 2020-2030
   - Fonts de dades reconegudes (DAP, SEVE, MITERD, EULA, etc.)

ENTREGABLES:
- Backend: emissions-import.service.ts, emissions-export.service.ts
- Frontend: ImportarEmissions.tsx, ExportarEmissions.tsx
- Plantilles CSV/Excel de exemple
- Tests d'importació/exportació
```

### Prompt 2.7: Validació i Qualitat de Dades d'Emissions

```
Implementa un sistema de validació i control de qualitat per als factors d'emissió.

REQUISITS:
1. Validacions automàtiques:
   - Script de validació que s'executa:
     - Després de cada importació
     - Diàriament (cron job)
     - Manualment per l'admin
   
   - Regles de validació:
     a) Completesa:
        - Tots els materials bàsics tenen factor A1
        - Tots els tipus de vehicle tenen factor A2/A4
        - Tots els combustibles tenen PCI i FE
        - Tots els equips bàsics tenen factor A5
     
     b) Coherència:
        - Factors d'emissió dins de rangs raonables
        - No valors negatius (excepte crèdits explícits)
        - Unitats consistents
        - Fonts de dades vàlides i no obsoletes
     
     c) Consistència temporal:
        - Anys de referència <= any actual
        - Factors actualitzats en els últims 3 anys (warning si no)
     
     d) Cobertura:
        - Percentatge de materials amb factor d'emissió
        - Llista de materials sense factor

2. Sistema d'alertes:
   - Alertes per email a admins si:
     - Hi ha factors amb valors sospitosos (fora de rang)
     - Fonts de dades obsoletes (>3 anys)
     - Materials importants sense factor d'emissió
     - Errors de consistència detectats
   
   - Dashboard de qualitat de dades:
     - Indicador de salut de la base de dades (%)
     - Llista de problemes detectats
     - Recomanacions per millorar

3. Frontend:
   - Pàgina de validació (/admin/emissions/validacio):
     - Executar validació manualment
     - Veure resultats de l'última validació
     - Llista de problemes amb severitat (error, warning, info)
     - Enllaç per corregir cada problema
     - Històric de validacions
   
   - Component IndicadorSalutDades:
     - Semàfor (verd/groc/vermell)
     - Percentatge de cobertura
     - Nombre de problemes

4. Tests:
   - Tests unitaris per a cada regla de validació
   - Tests d'integració amb dades de prova
   - Simulació d'errors i verificació de detecció

ENTREGABLES:
- Backend: emissions-validation.service.ts
- Frontend: ValidacioEmissions.tsx, IndicadorSalutDades.tsx
- Script de validació automàtica (cron)
- Sistema d'alertes per email
- Tests exhaustius
```

### Prompt 2.8: Georeferenciació i Mapes

```
Integra mapes interactius per a georeferenciació d'obres i ubicacions.

REQUISITS:
1. Frontend:
   - Integrar Leaflet o MapLibre GL
   - Component MapaProjecte:
     - Mostrar marcador de l'obra
     - Permetre seleccionar ubicació clicant al mapa
     - Cercador d'adreces (geocodificació)
   - Component MapaUbicacions:
     - Mostrar múltiples ubicacions (plantes, pedreres)
     - Diferents icones segons tipus
     - Popups amb informació
   - Component SelectorRuta:
     - Seleccionar origen i destí
     - Calcular i mostrar ruta
     - Mostrar distància

2. Backend:
   - Model Ubicacio (plantes, pedreres, obres)
   - Endpoints CRUD per a ubicacions
   - Integració amb OpenRouteService:
     - Service gis.service.ts
     - Funció calcularRuta(origen, desti)
     - Cache de rutes (Redis)

3. Funcionalitats:
   - Clic al mapa per seleccionar coordenades
   - Cercador d'adreces amb autocompletar
   - Càlcul automàtic de distàncies
   - Visualització de rutes

ENTREGABLES:
- Frontend: MapaProjecte.tsx, MapaUbicacions.tsx, SelectorRuta.tsx, useGIS.ts
- Backend: ubicacions.controller.ts, gis.service.ts
- Tests per a càlcul de rutes
```

---

## FASE 3: CÀLCULS ESTRUCTURALS

### Prompt 3.1: Motor de Càlcul Estructural

```
Implementa el motor de càlcul estructural per a ferms segons la norma 6.1 IC.

REQUISITS:
1. Backend (servei de càlcul):
   - Service calculsEstructurals.service.ts
   - Funcions:
     - calcularNEC(dadesTrans): number
       - Càlcul de nombre d'equivalències de càrrega
       - Factors de distribució, equivalència, creixement
     - verificarEstructura(capes, NEC, fons): ResultatVerificacio
       - Implementar model multicapa (simplificat BISAR)
       - Càlcul de tensions i deformacions
       - Verificació de fatiga i aixecament
     - generarCombinacionsCapes(tipologia, restriccions): Capa[][]
       - Generar totes les combinacions possibles
       - Respecting gruixos mínims, màxims i pas de 0.5cm

2. Models de dades:
   - EstructuraFirme
   - CapaFirme
   - ResultatVerificacio (viable, ratios, deformacions)

3. Algoritmes:
   - Càlcul de NEC segons PG-3
   - Model de multicapa per a tensions
   - Criteris de fallada per fatiga
   - Criteris d'aixecament

4. Tests:
   - Tests unitaris per a cada funció de càlcul
   - Tests amb casos coneguts (validació)

ENTREGABLES:
- Backend: calculsEstructurals.service.ts, models de dades
- Tests unitaris exhaustius
- Documentació de les fórmules implementades
```

### Prompt 3.2: Generador d'Estructures

```
Implementa el generador d'estructures de ferm viables.

REQUISITS:
1. Backend:
   - Service generadorEstructures.service.ts
   - Funció generarEstructuresViables(projecteId, restriccions):
     - Obtenir NEC del projecte
     - Generar totes les combinacions de capes possibles
     - Verificar cada estructura estructuralment
     - Filtrar només les viables
     - Ordenar per gruix total
     - Retornar llista d'estructures viables
   
2. Optimitzacions:
   - Paginació de resultats (no retornar tot de cop)
   - Caché de resultats
   - Processament asíncron per a projectes grans

3. Frontend:
   - Component GeneradorEstructures:
     - Formulari de restriccions (materials permesos, gruixos màxims)
     - Botó per generar estructures
     - Indicador de progrés
     - Llista d'estructures generades
     - Visualització en secció de cada estructura
   - Component ComparadorEstructures:
     - Seleccionar múltiples estructures per comparar
     - Taula comparativa
     - Gràfics de gruixos

ENTREGABLES:
- Backend: generadorEstructures.service.ts
- Frontend: GeneradorEstructures.tsx, ComparadorEstructures.tsx, EstructuraSeccio.tsx
- Tests d'integració
```

---

## FASE 4: CÀLCULS D'EMISSIONS

### Prompt 4.1: Calculadora d'Emissions A1-A5

```
Implementa la calculadora completa de la petjada de carboni segons OC 3/2024.

REQUISITS:
1. Backend:
   - Service calculsEmissions.service.ts amb funcions:
     - calcularEmissionsA1(composicio): number
     - calcularEmissionsA2(composicio, distancies): number
     - calcularEmissionsA3(parametresFabricacio): number
       - Implementar model termodinàmic de demanda energètica
       - Càlcul de variació d'entalpia
       - Consum de combustible
     - calcularEmissionsA4(distancia, mermes): number
     - calcularEmissionsA5(equips): number
     - calcularPetjadaTotal(dades): ResultatEmissions
   
2. Base de dades:
   - Factors d'emissió per a tots els materials (A1)
   - Factors de transport (A2, A4)
   - Constants calorífiques (A3)
   - Consums elèctrics (A3)
   - Emissions d'equips (A5)

3. Frontend:
   - Component CalculadoraEmissions:
     - Formulari per introduir dades A1-A5
     - Desglossament en temps real
     - Gràfic de contribució per etapa
     - Comparativa amb límits normatius
   - Component DesglossamentEmissions:
     - Taules detallades per etapa
     - Fórmules utilitzades
     - Fonts de dades

4. Tests:
   - Validació amb casos de prova coneguts
   - Comparació amb Excel EFAPAVE

ENTREGABLES:
- Backend: calculsEmissions.service.ts amb totes les funcions
- Frontend: CalculadoraEmissions.tsx, DesglossamentEmissions.tsx
- Tests unitaris i de validació
```

### Prompt 4.2: Integració Emissions-Estructura

```
Integra els càlculs d'emissions amb les estructures de ferm.

REQUISITS:
1. Backend:
   - Modificar generadorEstructures.service.ts:
     - Afegir càlcul d'emissions per a cada estructura viable
     - Emmagatzemar emissions a la base de dades
   - Endpoint per obtenir estructures amb emissions:
     - GET /projects/:id/estructures?incloureEmissions=true
   
2. Frontend:
   - Actualitzar ComparadorEstructures:
     - Afegir columna d'emissions totals
     - Afegir columna d'emissions per m²
     - Gràfic comparatiu d'emissions
   - Component EtiquetaEmissions:
     - Mostrar emissions amb color segons nivell
     - Indicador visual (verd/groc/vermell)

3. Funcionalitats:
   - Càlcul automàtic d'emissions quan es genera estructura
   - Actualització d'emissions si canvien distàncies
   - Filtre d'estructures per nivell d'emissions

ENTREGABLES:
- Backend: Modificacions a serveis existents
- Frontend: Actualitzacions de components
- Tests d'integració
```

---

## FASE 5: OPTIMITZACIÓ

### Prompt 5.1: Algoritmes d'Optimització

```
Implementa els algoritmes d'optimització multiobjectiu.

REQUISITS:
1. Backend:
   - Service optimitzacio.service.ts amb:
     - Funció optimitzarPonderacio(estructures, pesos):
       - Implementar weighted sum method
       - Retornar millor solució segons pesos
     - Funció optimitzarPareto(estructures):
       - Implementar algorisme NSGA-II simplificat
       - Trobar frontera de Pareto
       - Retornar solucions no dominades
     - Funció analisiSensibilitat(estructures):
       - Variar pesos en increments
       - Trobar solucions estables
       - Retornar matriu de resultats
   
2. Funcions objectiu:
   - F_estructural(estructura): number
   - F_emissions(estructura): number
   - F_economic(estructura): number
   - Normalització de valors

3. Frontend:
   - Component Optimitzador:
     - Selector de criteri (estructural/emissions/econòmic/combinat)
     - Sliders per configurar pesos (si és combinada)
     - Botó per executar optimització
     - Resultat amb justificació
   - Component FronteraPareto:
     - Gràfic 3D de la frontera (o 2D amb selecció d'eixos)
     - Punts interactius
     - Informació al fer hover
   - Component AnalisiSensibilitat:
     - Taula de resultats per diferents pesos
     - Gràfic de sensibilitat
     - Identificació de solucions robustes

ENTREGABLES:
- Backend: optimitzacio.service.ts amb tots els algoritmes
- Frontend: Optimitzador.tsx, FronteraPareto.tsx, AnalisiSensibilitat.tsx
- Tests per a algoritmes
```

### Prompt 5.2: Càlculs Econòmics

```
Implementa els càlculs econòmics i integra'ls amb l'optimització.

REQUISITS:
1. Backend:
   - Service calculsEconomics.service.ts amb:
     - calcularCostMaterial(material, gruix, preu): number
     - calcularCostTransport(material, distancia, tarifa): number
     - calcularCostFabricacio(tipusMescla, volum): number
     - calcularCostPosadaEnObra(gruix, area): number
     - calcularCostTotal(estructura, preus, distancies): number
   
2. Frontend:
   - Component CalculadoraEconomica:
     - Mostrar desglossament de costos
     - Comparativa entre estructures
     - Gràfic de costos per capa
   - Actualitzar ComparadorEstructures:
     - Afegir columnes de costos
     - Cost total per m²
     - Cost per any de vida útil

3. Integració:
   - Càlcul automàtic de costos per a cada estructura
   - Actualització en temps real si canvien preus
   - Filtre per rang de costos

ENTREGABLES:
- Backend: calculsEconomics.service.ts
- Frontend: CalculadoraEconomica.tsx, actualitzacions
- Tests
```

---

## FASE 6: CERTIFICATS PDF

### Prompt 6.1: Generador de Certificats PDF

```
Implementa el generador de certificats ambientals en PDF.

REQUISITS:
1. Backend:
   - Service certificats.service.ts amb:
     - generarCertificat(dadesCertificat): PDF
     - guardarCertificat(certificat): Certificat
     - obtenirCertificat(id): Certificat + URL PDF
   - Plantilla de certificat:
     - Disseny professional amb capçalera
     - Seccions: portada, resum, desglossament, metodologia, annex
     - Taules amb resultats
     - Gràfics de contribució
     - Signatura digital (opcional)
   
2. Frontend:
   - Component GeneradorCertificat:
     - Formulari per seleccionar mescla i obra
     - Preview del certificat
     - Botó per generar PDF
     - Indicador de progrés
   - Component LlistaCertificats:
     - Taula amb certificats emesos
     - Estat (vàlid, caducat, revocat)
     - Accions (descarregar, revocar)

3. Format PDF:
   - Portada amb logo i dades del fabricant
   - Resum executiu amb resultats clau
   - Taules detallades A1-A5
   - Gràfics de barres i circulars
   - Annex de càlcul complet
   - Numeració de pàgines
   - Peu de pàgina amb data i versió

ENTREGABLES:
- Backend: certificats.service.ts, plantilla PDF
- Frontend: GeneradorCertificat.tsx, LlistaCertificats.tsx
- Tests
```

### Prompt 6.2: Verificació de Compliment Normatiu

```
Implementa la verificació automàtica de compliment normatiu.

REQUISITS:
1. Backend:
   - Service verificacioNormativa.service.ts amb:
     - verificarComplimentOC3(emissions, tipologia): ResultatVerificacio
       - Comparar emissions amb límits establerts
       - Retornar si compleix, marge, percentatge
     - obtenirLimits(tipologia): Limits
       - Retornar límits aplicables segons tipologia
   
2. Base de dades:
   - Taula LimitsNormatius amb:
     - Tipologia de mescla
     - Etapa (A1-A5 o específica)
     - Límit numèric
     - Font normativa
     - Data d'entrada en vigor

3. Frontend:
   - Component IndicadorCompliment:
     - Semàfor visual (verd/groc/vermell)
     - Text explicatiu
     - Detall de límits aplicables
   - Alertes si no es compleix:
     - Missatge destacat
     - Recomanacions per millorar

ENTREGABLES:
- Backend: verificacioNormativa.service.ts
- Frontend: IndicadorCompliment.tsx
- Tests
```

---

## FASE 7: GIS I INTEGRACIONS

### Prompt 7.1: Integració GIS Completa

```
Completa la integració GIS amb totes les funcionalitats.

REQUISITS:
1. Backend:
   - Ampliar gis.service.ts:
     - geocodificarAdreca(adreca): coordenades
     - geocodificarInversa(coordenades): adreca
     - calcularDistanciaLineal(p1, p2): metres
     - calcularDistanciaCarretera(p1, p2): metres + geometria
     - batchCalcularRutes(origen, destinacions): array de rutes
   - Cache de rutes amb Redis (TTL: 24h)
   - Fallback a distància lineal + factor si falla API

2. Frontend:
   - Component MapaComplet:
     - Mostrar obra + plantes + pedreres
     - Rutes calculades amb colors
     - Controls de capes
     - Llegenda
   - Component SelectorUbicacio:
     - Cercador d'adreces
     - Selecció al mapa
     - Confirmació de coordenades
   - Component CalculDistancies:
     - Llista d'origens i destins
     - Càlcul batch de distàncies
     - Taula de resultats
     - Edició manual de distàncies

3. Integració:
   - Càlcul automàtic de distàncies quan es canvia ubicació
   - Actualització d'emissions si canvien distàncies
   - Visualització de rutes al mapa

ENTREGABLES:
- Backend: gis.service.ts ampliat
- Frontend: MapaComplet.tsx, SelectorUbicacio.tsx, CalculDistancies.tsx
- Tests
```

### Prompt 7.2: Integració BIM (IFC)

```
Implementa l'exportació a format BIM (IFC).

REQUISITS:
1. Backend:
   - Service bim.service.ts amb:
     - exportarAIFC(projecte, estructura): fitxer IFC
     - Crear entitats IFC:
       - IfcProject
       - IfcBuilding
       - IfcBuildingStorey
       - IfcBuildingElementProxy (per cada capa)
       - IfcPropertySet (propietats de capes)
     - Afegir propietats:
       - Gruix, material, mòdul elàstic
       - Emissions A1-A5
       - Costos
   
2. Frontend:
   - Component ExportadorBIM:
     - Selector d'estructura a exportar
     - Botó per descarregar IFC
     - Informació sobre compatibilitat
   - Instruccions per importar a:
     - Revit
     - ArchiCAD
     - Tekla
     - FreeCAD

3. Format IFC:
   - Complir estàndard IFC4
   - Incloure totes les propietats rellevants
   - Geometria simplificada (extrusió de capes)

ENTREGABLES:
- Backend: bim.service.ts
- Frontend: ExportadorBIM.tsx
- Tests
```

---

## FASE 8: INTERNACIONALITZACIÓ

### Prompt 8.1: Sistema d'Internacionalització (i18n)

```
Implementa el sistema complet d'internacionalització.

REQUISITS:
1. Frontend:
   - Configurar react-i18next
   - Crear fitxers de traducció:
     - ca.json (català)
     - es.json (castellà)
     - en.json (anglès)
     - fr.json (francès)
   - Cobrir tots els textos de l'aplicació:
     - Navegació i menús
     - Formularis i etiquetes
     - Missatges d'error
     - Botons i accions
     - Contingut dels certificats
     - Annexos de càlcul
   
2. Selector d'idioma:
   - Component SelectorIdioma:
     - Dropdown amb banderes
     - Canvi immediat sense recarregar
     - Preferència guardada (localStorage)
   
3. Backend:
   - Middleware per detectar idioma de l'usuari
   - Traduccions emmagatzemades a la base de dades (opcional)
   - Certificats PDF generats en l'idioma seleccionat

4. Formats locals:
   - Dates segons locale
   - Números (decimals, separadors)
   - Monedes (€, $, etc.)
   - Unitats (km, m, t, kg)

ENTREGABLES:
- Frontend: Configuració i18n, 4 fitxers de traducció, SelectorIdioma.tsx
- Backend: Middleware d'idioma
- Tests
```

### Prompt 8.2: Traducció de Contingut Dinàmic

```
Implementa la traducció de contingut dinàmic (certificats, informes).

REQUISITS:
1. Backend:
   - Service traduccio.service.ts amb:
     - traduirCertificat(certificat, idioma): certificat traduït
     - traduirAnnex(annex, idioma): annex traduït
     - Plantilles de certificats per idioma
   
2. PDFs multilingües:
   - Generar certificats en l'idioma seleccionat
   - Incloure totes les seccions traduïdes
   - Mantenir format i disseny

3. Frontend:
   - Selector d'idioma per a informes
   - Preview del certificat en l'idioma seleccionat
   - Descàrrega en múltiples idiomes

ENTREGABLES:
- Backend: traduccio.service.ts, plantilles multilingües
- Frontend: Selector d'idioma per informes
- Tests
```

---

## FASE 9: TESTING I DESPLEGAMENT

### Prompt 9.1: Testing Complet

```
Implementa la suite completa de tests.

REQUISITS:
1. Tests unitaris:
   - Jest per a backend i frontend
   - Cobertura mínima del 80%
   - Tests per a:
     - Funcions de càlcul (estructural, emissions, econòmic)
     - Serveis
     - Utilitats
     - Components (React Testing Library)

2. Tests d'integració:
   - Supertest per a endpoints API
   - Fluxos complets (crear projecte → generar estructures → optimitzar)
   - Autenticació i autorització

3. Tests end-to-end:
   - Playwright per a fluxos d'usuari
   - Escenaris crítics:
     - Login → Crear projecte → Generar estructures → Veure resultats
     - Generar certificat → Descarregar PDF
     - Importar banc de preus → Publicar versió

4. Tests de rendiment:
   - k6 per a càrrega de l'API
   - Lighthouse per a frontend
   - Optimització de consultes SQL

ENTREGABLES:
- Suite completa de tests
- Configuració de CI/CD (GitHub Actions)
- Informes de cobertura
```

### Prompt 9.2: Desplegament i DevOps

```
Configura el desplegament i l'entorn de producció.

REQUISITS:
1. Backend:
   - Dockerització:
     - Dockerfile per a Node.js
     - docker-compose.yml per a desenvolupament
     - docker-compose.prod.yml per a producció
   - Configuració per a AWS / Azure / GCP:
     - ECS / Kubernetes
     - RDS per a PostgreSQL
     - ElastiCache per a Redis
     - S3 per a fitxers
   - CI/CD:
     - GitHub Actions per a build i deploy
     - Desplegament automàtic a staging
     - Desplegament manual a producció

2. Frontend:
   - Build optimitzat amb Vite
   - Desplegament a Vercel / Netlify / S3+CloudFront
   - Variables d'entorn per a URLs d'API
   - Analítiques (opcional)

3. Base de dades:
   - Migracions automatitzades
   - Backups diaris
   - Monitorització

4. Monitorització:
   - Logs amb Winston (backend)
   - Errors amb Sentry
   - Mètriques amb CloudWatch / Datadog

ENTREGABLES:
- Dockerfile i docker-compose
- Configuració CI/CD
- Scripts de desplegament
- Documentació d'operacions
```

---

## RESUM DE PROMPTS

| Fase | Prompt | Descripció | Prioritat |
|------|--------|------------|-----------|
| 1.1 | Inicialització del Projecte | Estructura base frontend | Alta |
| 1.2 | Backend Base i Base de Dades | Express + Prisma + PostgreSQL | Alta |
| 1.3 | Sistema d'Autenticació | JWT + refresh tokens | Alta |
| 2.1 | CRUD de Projectes | Gestió de projectes | Alta |
| 2.2 | Gestió de Materials | Base de dades mestra + versions | Alta |
| **2.3** | **Base de Dades d'Emissions - Estructura** | **Models Prisma per A1-A5** | **Alta** |
| **2.4** | **Seed de Base de Dades d'Emissions** | **Dades inicials OC 3/2024** | **Alta** |
| **2.5** | **Gestió de Factors d'Emissió** | **Admin CRUD emissions** | **Alta** |
| **2.6** | **Importació/Exportació Emissions** | **CSV/Excel per factors** | **Mitjana** |
| **2.7** | **Validació de Dades d'Emissions** | **Qualitat i alertes** | **Mitjana** |
| 2.8 | Georeferenciació i Mapes | Leaflet + OpenRouteService | Alta |
| 3.1 | Motor de Càlcul Estructural | Algoritmes 6.1 IC | Alta |
| 3.2 | Generador d'Estructures | Combinacions i verificació | Alta |
| 4.1 | Calculadora d'Emissions A1-A5 | OC 3/2024 completa | Alta |
| 4.2 | Integració Emissions-Estructura | Càlcul automàtic | Alta |
| 5.1 | Algoritmes d'Optimització | Pareto + ponderació | Alta |
| 5.2 | Càlculs Econòmics | Costos i integració | Mitjana |
| 6.1 | Generador de Certificats PDF | PDFs professionals | Alta |
| 6.2 | Verificació de Compliment | Normativa OC 3/2024 | Mitjana |
| 7.1 | Integració GIS Completa | Rutes i distàncies | Mitjana |
| 7.2 | Integració BIM (IFC) | Exportació IFC | Baixa |
| 8.1 | Sistema d'Internacionalització | i18n ca/es/en/fr | Mitjana |
| 8.2 | Traducció de Contingut Dinàmic | Certificats multilingües | Mitjana |
| 9.1 | Testing Complet | Unitari, integració, e2e | Alta |
| 9.2 | Desplegament i DevOps | Docker + CI/CD | Alta |

---

**TOTAL: 25 PROMPTS**

---

**NOTA IMPORTANT PER A CODEX:**

Cada prompt s'ha d'executar de manera incremental. Després de cada prompt:
1. Revisar el codi generat
2. Executar tests si estan disponibles
3. Corregir errors abans de passar al següent
4. Fer commit dels canvis amb missatges descriptius

L'ordre dels prompts és important. No saltar fases.

**Els prompts 2.3 a 2.7 (Base de Dades d'Emissions) són CRÍTICS** perquè la qualitat dels càlculs de petjada de carboni depèn directament d'aquestes dades.
