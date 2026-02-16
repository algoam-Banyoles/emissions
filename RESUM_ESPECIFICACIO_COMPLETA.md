# RESUM DE L'ESPECIFICACIÓ COMPLETA

## Aplicació: Calculadora Optimitzadora de Ferms i Certificats Ambientals

---

## 1. VISIÓ GENERAL

### 1.1 Què farem?

Desenvoluparem una **aplicació SaaS professional** que permetrà:

1. **Optimitzar solucions de ferm** des de tres perspectives:
   - **Estructural**: Compliment de la normativa 6.1 IC i 6.3 IC
   - **Ambiental**: Minimització de la petjada de carboni (A1-A5 segons OC 3/2024)
   - **Econòmica**: Minimització del cost total del projecte

2. **Generar certificats ambientals de producte** per a fabricants de mescles bituminoses:
   - Càlcul complet de la petjada de carboni
   - Verificació de compliment normatiu
   - PDF professional amb annex de càlcul

3. **Complir integralment la normativa espanyola**:
   - Norma 6.1 IC (firmes de nova construcció)
   - Norma 6.3 IC (rehabilitació de firmes)
   - PG-3 (pliego de prescripciones)
   - OC 3/2024 (càlcul de la petjada de carboni)
   - OC 2022-03 (AUTL)
   - OC 2023-01 (actualització 6.1 IC)
   - OC 2023-02 (reutilització de capes)

### 1.2 Tipologies de Projectes Suportats

- ✅ Firmes de nova construcció
- ✅ Reforç de firmes existents
- ✅ Reciclatge en fred in situ (RFE)
- ✅ Reciclatge en calent en central
- ✅ Tecnologies avançades (AUTL)

### 1.3 Funcionalitats Clau

- 📍 **Georeferenciació**: Obres, plantes d'asfalt i pedreres al mapa
- 🛣️ **Càlcul automàtic de distàncies** (integració GIS)
- 🔢 **Generació de combinacions** de capes (pas mínim 0,5cm)
- 🎯 **Optimització multiobjectiu** (Pareto, ponderació configurable)
- 📄 **Certificats PDF** amb i18n (català, castellà, anglès, francès)
- 🗄️ **Base de dades versionable** (només editable per l'administrador)
- 🔒 **Seguretat**: Dades encriptades, accés controlat
- 🏗️ **Integració BIM** (exportació IFC)

---

## 2. ALGORITMES DE CÀLCUL

### 2.1 Càlcul Estructural (Norma 6.1 IC)

#### 2.1.1 Càlcul de la NEC (Necessitat Estructural de Càrrega)

```
NEC = 365 × IMD × %VP × FD × FE × FC

On:
- IMD = Intensitat mitjana diària (vehicles/dia)
- %VP = Percentatge de vehicles pesants
- FD = Factor de distribució per carril
- FE = Factor d'equivalència de danys (eixos de 80 kN)
- FC = Factor de creixement acumulat
```

#### 2.1.2 Verificació Estructural (Mètode Multicapa)

Per a cada estructura generada, es verifica:

1. **Fatiga per flexió** (capes bituminoses):
   ```
   N_fatiga = k1 × (1/εt)^k2 × (1/E)^k3 × (1/h)^k4
   
   On εt = deformació de tracció a la base de la capa
   ```

2. **Aixecament per cortant** (subbase i fonament):
   ```
   N_rutting = C × (1/εc)^n
   
   On εc = deformació de compressió vertical
   ```

3. **Deformació total** < 25 mm

#### 2.1.3 Generació de Combinacions

L'algoritme genera **totes les combinacions possibles** de:
- **CR** (Capa de Rodament): 4-8 cm, pas 0,5 cm
- **CI** (Capa Intermèdia): 6-12 cm, pas 0,5 cm
- **CB** (Capa de Base): 10-20 cm, pas 0,5 cm
- **CS** (Capa de Subbase): 15-30 cm, pas 0,5 cm

Per a cada capa, es consideren tots els materials permesos.

### 2.2 Càlcul d'Emissions (OC 3/2024)

#### 2.2.1 Etapa A1: Producció de Materials

```
E_A1 = Σ (m_i × FE_i)

Materials i factors d'emissió (kg CO2e/t):
- Àrido natural: 4.48
- Àrido siderúrgico: 3.69
- Betún convencional: 272.0
- Betún PMB: 465.0
- Emulsió C65B5: 227.0
- RA tractat: 2.16
- RARx (pols de neumàtics): -141.0 (crèdit!)
- Cement CEM III: 427.8
```

#### 2.2.2 Etapa A2: Transport de Materials

```
E_A2 = Σ (m_i × d_i × FE_transport)

Factors de transport (kg CO2e/t·km):
- Camió semiremolque 28t: 0.0849
- Camió cisterna 24t: 0.0881
- Camió rígid 9t: 0.17
```

#### 2.2.3 Etapa A3: Fabricació (Model Termodinàmic)

**Demanda energètica neta** (variació d'entalpia):
```
ΔH = Σ (m_i × Ce_i × ΔT_i) + m_j × C_W

Constants calorífiques:
- Ce àrids naturals: 0.835 kJ/kg·K
- Ce betún: 2.093 kJ/kg·K
- Calor vaporització: 2.25 MJ/kg
```

**Consum de combustible**:
```
D_c = (1 / (1 - p)) × ((ΔH + P) / PCI)

On:
- p = pèrdues de calor (%)
- P = pèrdues per rendiment (MJ)
- PCI = poder calorífic inferior
```

**Factors d'emissió de combustibles**:
- Fuelóleo: 93.2 kg CO2e/GJ
- Gas natural: 70.19 kg CO2e/GJ
- Gasóleo: 3.17 kg CO2e/kg

#### 2.2.4 Etapa A4: Transport de la Mescla

```
E_A4 = m_mb × d × FE_transport

Inclou mermes de puesta en obra (tipicament 2%)
```

#### 2.2.5 Etapa A5: Puesta en Obra

```
E_A5 = Σ (hores_equip_i × FE_equip_i)

Emissions d'equips (kg CO2e/h):
- Silo de transferència: 147.8
- Extendedora: 117.1
- Compactador tàndem 11t: 34.0
- Compactador neumàtics 21t: 55.8
- Fresadora 1m: 124.4
- Minibarredora: 25.0
```

#### 2.2.6 Petjada Total

```
E_total = E_A1 + E_A2 + E_A3 + E_A4 + E_A5

Unitats:
- kg CO2e per tona de mescla bituminosa
- kg CO2e per m² de secció completa
```

### 2.3 Algoritmes d'Optimització Multiobjectiu

#### 2.3.1 Funcions Objectiu

**F1 - Estructural** (minimitzar):
```
F1 = 0.4 × gruix_total + 0.3 × cost_materials + 0.3 × (1/marge_seguretat)
```

**F2 - Emissions** (minimitzar):
```
F2 = E_A1 + E_A2 + E_A3 + E_A4 + E_A5
```

**F3 - Econòmic** (minimitzar):
```
F3 = cost_materials + cost_transport + cost_fabricacio + cost_posada_en_obra
```

#### 2.3.2 Algoritme de Ponderació Configurable

```
F_total = w1 × F1 + w2 × F2 + w3 × F3

On w1 + w2 + w3 = 1
```

L'usuari pot configurar els pesos segons prioritats del projecte.

#### 2.3.3 Algoritme de Frontera de Pareto

Troba totes les solucions **no dominades**:
- Una solució domina una altra si és millor en almenys un objectiu i no pitjor en cap
- La frontera de Pareto mostra el compromís entre objectius
- L'usuari pot triar de la frontera segons preferències

### 2.4 Càlcul Econòmic

```
Cost_total = Σ (cost_material_i + cost_transport_i) + cost_fabricacio + cost_posada_en_obra

On:
- cost_material = preu (€/t) × quantitat (t)
- cost_transport = tarifa (€/t·km) × distància (km) × quantitat (t)
- cost_fabricacio = tarifa (€/t) × volum (t)
- cost_posada_en_obra = tarifa (€/m²) × àrea (m²)
```

---

## 3. ARQUITECTURA TÈCNICA

### 3.1 Stack Tecnològic

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (estils)
- shadcn/ui (components)
- Zustand (estat global)
- React Query (gestió de dades)
- React Router (navegació)
- React-i18next (internacionalització)
- Leaflet / MapLibre (mapes)
- Recharts (gràfics)

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (base de dades)
- Redis (caché)
- JWT (autenticació)
- Zod (validació)
- Winston (logs)

**Infraestructura:**
- Docker + Docker Compose
- AWS / Azure / GCP
- CI/CD amb GitHub Actions
- S3 (emmagatzematge de fitxers)

### 3.2 Model de Dades Principal

**Entitats Core:**
- Organitzacio (fabricants, consultories, administracions)
- Usuari (amb rols: admin, projectista, fabricant, lector)
- Projecte (dades del trànsit, ubicació, estat)
- EstructuraFirme (solucions generades)
- CapaFirme (capes individuals)
- Material (propietats estructurals i ambientals)
- MesclaBituminosa (per a certificats)
- CertificatAmbiental (PDF generat)
- Ubicacio (plantes, pedreres, obres)
- VersioBaseDades (versions de la base de dades)

### 3.3 Seguretat

- **Autenticació**: JWT amb refresh tokens (httpOnly cookies)
- **Autorització**: Middleware de verificació de rols
- **Encriptació**: AES-256 per a dades en repòs, TLS 1.3 per a dades en trànsit
- **Protecció de dades mestres**: Només l'administrador pot modificar la base de dades
- **Logs d'auditoria**: Registre de tots els canvis crítics

### 3.4 Sistema de Versions

La base de dades és **versionable**:
- L'administrador pot carregar noves versions via CSV/Excel
- Cada versió té número, data i descripció
- Els usuaris treballen sempre amb la versió activa
- Es manté historial de versions per a traçabilitat
- Possibilitat de revertir a versions anteriors

---

## 4. INTERFÍCIE D'USUARI

### 4.1 Flux de Treball

```
1. CREAR PROJECTE
   └── Dades del trànsit (IMD, %VP, TT, ZC)
   └── Georeferenciar obra al mapa
   └── Definir vida útil i creixement

2. DEFINIR ESTRUCTURA
   └── Seleccionar tipologia (nova/reforç/reciclatge)
   └── Configurar restriccions (materials, gruixos)

3. CONFIGURAR ORÍGENS
   └── Ubicar plantes d'asfalt al mapa
   └── Ubicar pedreres i proveïdors
   └── Calcular distàncies automàticament

4. GENERAR SOLUCIONS
   └── Generar totes les combinacions possibles
   └── Verificar estructuralment
   └── Calcular emissions i costos

5. OPTIMITZAR
   └── Seleccionar criteri d'optimització
   └── Configurar pesos (si és combinada)
   └── Executar algorisme
   └── Visualitzar frontera de Pareto (opcional)

6. RESULTATS
   └── Comparar solucions
   └── Veure detall per etapa
   └── Exportar informes
   └── Generar certificats (fabricants)
```

### 4.2 Pantalles Principals

- **Dashboard**: Resum de projectes, gràfics d'emissions, alertes
- **Llista de Projectes**: Taula amb filtres i paginació
- **Detall de Projecte**: Dades completes, edició inline, històric
- **Editor d'Estructures**: Visualització en secció, comparador
- **Calculadora d'Emissions**: Formulari A1-A5, desglossament en temps real
- **Mapa Interactiu**: Obra, plantes, rutes, distàncies
- **Optimitzador**: Sliders de pesos, resultats, frontera de Pareto
- **Generador de Certificats**: Preview, generació PDF
- **Administració**: Gestió de materials, versions, importació de preus

### 4.3 Internationalització (i18n)

Idiomes suportats:
- Català (ca)
- Castellà (es)
- Anglès (en)
- Francès (fr)

Tots els textos de l'aplicació estan traduïts, incloent:
- Navegació i menús
- Formularis i etiquetes
- Missatges d'error
- Contingut dels certificats PDF
- Annexos de càlcul

---

## 5. CERTIFICATS AMBIENTALS

### 5.1 Procés de Generació

1. **Seleccionar mescla** del catàleg del fabricant
2. **Seleccionar obra** (amb ubicació georeferenciada)
3. **Calcular distàncies** automàticament
4. **Verificar compliment** normatiu
5. **Generar PDF** amb:
   - Portada professional
   - Resum executiu
   - Desglossament A1-A5
   - Gràfics de contribució
   - Metodologia i fonts
   - Annex de càlcul complet
   - Data d'emissió i caducitat

### 5.2 Verificació de Compliment

L'aplicació verifica automàticament si les emissions compleixen els límits establerts a l'OC 3/2024:

```
Resultat = {
  compleix: true/false,
  emissions_calculades: 52.5,  // kg CO2e/t
  limit_aplicable: 70.0,       // kg CO2e/t
  marge: 17.5,                 // kg CO2e/t
  percentatge_sobre_limit: 75% //
}
```

Si no es compleix, es mostren recomanacions per reduir emissions.

---

## 6. INTEGRACIONS EXTERNES

### 6.1 GIS i Mapes

- **Proveïdor**: OpenStreetMap + OpenRouteService (gratuït)
- **Funcionalitats**:
  - Visualització de mapes interactius
  - Geocodificació d'adreces
  - Càlcul de rutes per carretera
  - Visualització de distàncies
  - Caché de rutes (24h)
- **Fallback**: Distància lineal + factor corrector (1.3)

### 6.2 BIM (IFC)

- **Exportació**: Format IFC4
- **Entitats**: IfcProject, IfcBuildingElementProxy (capes)
- **Propietats**: Gruix, material, mòdul elàstic, emissions, costos
- **Compatibilitat**: Revit, ArchiCAD, Tekla, FreeCAD

### 6.3 Bancs de Preus

- **Formats suportats**: CSV, Excel (DGC, BEDEC, TCQ2000)
- **Procés**: Importació → Validació → Nova versió → Publicació
- **Automatització**: Càrrega massiva de preus

---

## 7. PROMPTS PER CODEX

S'han generat **25 prompts incrementals** per desenvolupar l'aplicació amb Codex a VS Code:

### Fase 1: Estructura Base (3 prompts)
- Inicialització del projecte (Vite + React + TypeScript)
- Backend base (Express + Prisma + PostgreSQL)
- Sistema d'autenticació (JWT + refresh tokens)

### Fase 2: Gestió de Dades (8 prompts)
- CRUD de projectes
- Gestió de materials i versions de base de dades
- **Base de Dades d'Emissions - Estructura** (models per A1-A5)
- **Seed de Base de Dades d'Emissions** (dades inicials OC 3/2024)
- **Gestió de Factors d'Emissió** (admin CRUD)
- **Importació/Exportació Emissions** (CSV/Excel)
- **Validació de Dades d'Emissions** (qualitat i alertes)
- Georeferenciació i mapes

### Fase 3: Càlculs Estructurals (2 prompts)
- Motor de càlcul estructural (6.1 IC)
- Generador d'estructures viables

### Fase 4: Càlculs d'Emissions (2 prompts)
- Calculadora d'emissions A1-A5 (OC 3/2024)
- Integració emissions-estructura

### Fase 5: Optimització (2 prompts)
- Algoritmes d'optimització multiobjectiu
- Càlculs econòmics

### Fase 6: Certificats (2 prompts)
- Generador de certificats PDF
- Verificació de compliment normatiu

### Fase 7: Integracions (2 prompts)
- Integració GIS completa
- Integració BIM (IFC)

### Fase 8: Internacionalització (2 prompts)
- Sistema d'internacionalització (i18n)
- Traducció de contingut dinàmic

### Fase 9: Testing i Desplegament (2 prompts)
- Testing complet (unitari, integració, e2e)
- Desplegament i DevOps (Docker + CI/CD)

---

## 8. CARACTERÍSTIQUES DESTACADES

### 8.1 Rigor Tècnic

- ✅ Totes les solucions possibles generades automàticament
- ✅ Verificació estructural completa segons 6.1 IC
- ✅ Càlcul d'emissions seguint exactament l'OC 3/2024
- ✅ Fórmules documentades i justificades
- ✅ Fonts de dades referenciades (DAP, SEVE, MITERD)

### 8.2 Flexibilitat

- ✅ Base de dades completament configurable (sense hardcoding)
- ✅ Pesos d'optimització configurables per l'usuari
- ✅ Importació de bancs de preus (DGC, BEDEC, TCQ2000)
- ✅ Sistema de versions per a traçabilitat
- ✅ Múltiples tipologies de projectes

### 8.3 Usabilitat

- ✅ Interfície intuïtiva i moderna
- ✅ Mapes interactius per a georeferenciació
- ✅ Visualització en secció de les estructures
- ✅ Gràfics comparatius en temps real
- ✅ Formularis amb validació intel·ligent

### 8.4 Professionalitat

- ✅ Certificats PDF amb disseny professional
- ✅ Annex de càlcul complet i detallat
- ✅ Internationalització (4 idiomes)
- ✅ Compliment normatiu espanyol
- ✅ Integració BIM per a flux de treball professional

---

## 9. LLIURABLES GENERATS

1. **Especificació Tècnica Completa** (`especificacio_aplicacio_firmes.md`)
   - Algoritmes de càlcul detallats
   - Model de dades complet
   - Arquitectura tècnica
   - Interfície d'usuari

2. **Prompts Incrementals** (`prompts_codex_incrementals.md`)
   - 20 prompts per desenvolupar amb Codex
   - Ordenats per fases
   - Amb requisits clars i entregables definits

3. **Resum Consolidat** (`RESUM_ESPECIFICACIO_COMPLETA.md`)
   - Visió general de l'aplicació
   - Algoritmes explicats
   - Arquitectura resumida
   - Característiques destacades

---

## 10. SEGÜENTS PASSOS

Per desenvolupar l'aplicació:

1. **Revisar** els documents generats
2. **Ajustar** qualsevol requisit específic
3. **Començar** amb el Prompt 1.1 a Codex
4. **Seguir** l'ordre dels prompts (no saltar fases)
5. **Testejar** cada component abans de passar al següent
6. **Fer commits** regulars amb missatges descriptius

**Temps estimat de desenvolupament**: 3-4 mesos amb un equip de 2-3 desenvolupadors.

---

**Document generat per l'Agent Swarm d'Enginyeria i Desenvolupament**
**Data: 2025-01-XX**
**Versió: 1.0**
