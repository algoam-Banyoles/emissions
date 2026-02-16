# NORMATIVA 6.1 IC - ESPLANADES I SECCIONS (PER A SEED)

## NOTA IMPORTANT
Aquest document conté TOTA la informació necessària de la Norma 6.1 IC i el PG-3 per configurar la base de dades d'esplanades i seccions. **NO és necessari fer scraping**, totes les dades estan aquí.

---

## 1. TIPUS D'ESPLANADA (5 tipus)

### ESPLANADA TIPO I - E1
```
Codi: E1
Nom: "Roca de molt bona qualitat"
Resistència a compressió: > 100 MPa
Coeficient de reacció (K): > 100 MN/m³
Categories de trànsit permeses: TT1, TT2, TT3, TT4, TT5
Descripció: Roca sana, sense alteració, amb resistència a compressió simple (Rc) superior a 100 MPa. Inclou granits, basalt, calcàries compactes, etc.
Característiques:
- Mòdul elàstic del fons: > 500 MPa
- CBR: > 100%
- Permeabilitat: Molt baixa
- Expansivitat: Nul·la
```

### ESPLANADA TIPO II - E2
```
Codi: E2
Nom: "Roca de bona qualitat"
Resistència a compressió: 50 - 100 MPa
Coeficient de reacció (K): 50 - 100 MN/m³
Categories de trànsit permeses: TT1, TT2, TT3, TT4, TT5
Descripció: Roca amb Rc entre 50 i 100 MPa. Pot tenir alguna alteració superficial. Inclou gresos compactes, calcàries denses, etc.
Característiques:
- Mòdul elàstic del fons: 200 - 500 MPa
- CBR: 60 - 100%
- Permeabilitat: Baixa
- Expansivitat: Molt baixa
```

### ESPLANADA TIPO III - E3
```
Codi: E3
Nom: "Roca de qualitat mitjana"
Resistència a compressió: 25 - 50 MPa
Coeficient de reacció (K): 25 - 50 MN/m³
Categories de trànsit permeses: TT1, TT2, TT3, TT4
Descripció: Roca amb Rc entre 25 i 50 MPa. Pot estar alterada. Inclou gresos, margues compactes, etc.
Característiques:
- Mòdul elàstic del fons: 100 - 200 MPa
- CBR: 30 - 60%
- Permeabilitat: Mitjana
- Expansivitat: Baixa
```

### ESPLANADA TIPO IV - E4
```
Codi: E4
Nom: "Sòls granulars"
Resistència a compressió: 5 - 25 MPa
Coeficient de reacció (K): 10 - 25 MN/m³
Categories de trànsit permeses: TT1, TT2, TT3
Descripció: Sòls granulars compactats (grava, sorra, graves) amb índex de plàsticitat (IP) inferior al 15%. No expansius.
Característiques:
- Mòdul elàstic del fons: 50 - 100 MPa
- CBR: 15 - 30%
- Permeabilitat: Alta
- Expansivitat: Nul·la
- IP: < 15%
```

### ESPLANADA TIPO V - E5
```
Codi: E5
Nom: "Sòls fins"
Resistència a compressió: < 5 MPa
Coeficient de reacció (K): < 10 MN/m³
Categories de trànsit permeses: TT1, TT2
Descripció: Sòls fins (limos, argiles) amb IP superior al 15%. Poden ser expansius. Requereixen tractament especial.
Característiques:
- Mòdul elàstic del fons: < 50 MPa
- CBR: < 15%
- Permeabilitat: Molt baixa
- Expansivitat: Variable (pot ser alta)
- IP: > 15%
- Requereix: Subbase obligatòria i possible tractament del fons
```

---

## 2. CATEGORIES DE TRÀNSIT (TT1 - TT5)

Segons el PG-3 (Pliego de Prescripciones):

```
CATEGORIA | IMD (veh/dia) | %VP (pesats) | Descripció
----------|---------------|--------------|------------
TT1       | < 150         | < 10%        | Trànsit molt lleuger
TT2       | 150 - 1.500   | 10% - 20%    | Trànsit lleuger
TT3       | 1.500 - 6.000 | 15% - 25%    | Trànsit mitjà
TT4       | 6.000 - 15.000| 20% - 30%    | Trànsit pesat
TT5       | > 15.000      | > 25%        | Trànsit molt pesat
```

**Nota**: Si IMD i %VP no encaixen exactament, aplicar la categoria més restrictiva.

---

## 3. SECCIONS TÍPIQUES DE FERM

### Secció Tipus S1: CR + CI + CB
```
Codi: S1
Nom: "Secció mínima"
Capes: CR (Capa de Rodament) + CI (Capa Intermèdia) + CB (Capa de Base)
Gruixos típics:
- CR: 4-8 cm
- CI: 6-12 cm
- CB: 10-20 cm
Gruix total: 20-40 cm
Us: Trànsit lleuger a mitjà sobre esplanades bones
```

### Secció Tipus S2: CR + CI + CB + CS
```
Codi: S2
Nom: "Secció amb subbase"
Capes: CR + CI + CB + CS (Capa de Subbase)
Gruixos típics:
- CR: 4-8 cm
- CI: 6-12 cm
- CB: 10-20 cm
- CS: 15-30 cm
Gruix total: 35-70 cm
Us: Trànsit pesat o esplanades de qualitat mitjana/baixa
```

### Secció Tipus S3: CR + CB + CS
```
Codi: S3
Nom: "Secció sense capa intermèdia"
Capes: CR + CB + CS
Gruixos típics:
- CR: 6-10 cm (més gruixuda)
- CB: 15-25 cm
- CS: 15-30 cm
Gruix total: 36-65 cm
Us: Trànsit lleuger, estructures simplificades
```

### Secció Tipus S4: CR + CI + CB + CS + CTR
```
Codi: S4
Nom: "Secció amb tractament de fons"
Capes: CR + CI + CB + CS + CTR (Capa de Tractament del Relleno)
Gruixos típics:
- CR: 4-8 cm
- CI: 6-12 cm
- CB: 10-20 cm
- CS: 15-30 cm
- CTR: 20-40 cm
Gruix total: 55-110 cm
Us: Esplanades de mala qualitat (E5), trànsit pesat
```

---

## 4. COMBINACIONS ESPLANADA + TRÀNSIT → SECCIONS PERMESES

### Per a TT1 (Trànsit molt lleuger)
```
E1 (Roca molt bona)    → S1, S2, S3
E2 (Roca bona)         → S1, S2, S3
E3 (Roca mitjana)      → S1, S2, S3
E4 (Sòls granulars)    → S1, S2, S3
E5 (Sòls fins)         → S2, S3, S4 (obligatori subbase)
```

### Per a TT2 (Trànsit lleuger)
```
E1 (Roca molt bona)    → S1, S2
E2 (Roca bona)         → S1, S2
E3 (Roca mitjana)      → S1, S2
E4 (Sòls granulars)    → S1, S2
E5 (Sòls fins)         → S2, S4 (obligatori subbase)
```

### Per a TT3 (Trànsit mitjà)
```
E1 (Roca molt bona)    → S1, S2
E2 (Roca bona)         → S1, S2
E3 (Roca mitjana)      → S1, S2
E4 (Sòls granulars)    → S2 (obligatori subbase)
E5 (Sòls fins)         → S2, S4 (obligatori subbase)
```

### Per a TT4 (Trànsit pesat)
```
E1 (Roca molt bona)    → S1, S2
E2 (Roca bona)         → S1, S2
E3 (Roca mitjana)      → S2 (obligatori subbase)
E4 (Sòls granulars)    → S2 (obligatori subbase)
E5 (Sòls fins)         → S2, S4 (obligatori subbase + tractament)
```

### Per a TT5 (Trànsit molt pesat)
```
E1 (Roca molt bona)    → S1, S2
E2 (Roca bona)         → S2 (obligatori subbase)
E3 (Roca mitjana)      → S2 (obligatori subbase)
E4 (Sòls granulars)    → S2 (obligatori subbase)
E5 (Sòls fins)         → S4 (obligatori subbase + tractament)
```

---

## 5. MATERIALS PER TIPO DE CAPA

### CR - Capa de Rodament (4-8 cm)
```
Materials permesos:
- Mescla bituminosa d'ús M (densa, semidensa, discontinua)
- Mescla bituminosa d'ús E (alta estabilitat, alta deformació)
- Mescla bituminosa d'ús S (alta estabilitat, baixa deformació)
- Mescla bituminosa d'ús T (alta deformació, alta estabilitat)

Gruixos:
- Mínim: 4.0 cm
- Màxim: 8.0 cm
- Pas: 0.5 cm
```

### CI - Capa Intermèdia (6-12 cm)
```
Materials permesos:
- Mescla bituminosa d'ús M, E, A, S, T
- Macadams bituminosos
- Estabilitzats amb betum

Gruixos:
- Mínim: 6.0 cm
- Màxim: 12.0 cm
- Pas: 0.5 cm
```

### CB - Capa de Base (10-20 cm)
```
Materials permesos:
- Mescla bituminosa d'ús G (granulometria oberta)
- Macadams bituminosos
- Estabilitzats amb betum
- Grava-estabilitzada amb ciment
- Grava natural compactada

Gruixos:
- Mínim: 10.0 cm
- Màxim: 20.0 cm
- Pas: 0.5 cm
```

### CS - Capa de Subbase (15-30 cm)
```
Materials permesos:
- Grava-estabilitzada amb ciment
- Grava natural compactada
- Sorra-estabilitzada amb ciment
- Materials granulars no tractats

Gruixos:
- Mínim: 15.0 cm
- Màxim: 30.0 cm
- Pas: 0.5 cm
```

---

## 6. TAULA RESUM PER A SEED

```javascript
// Dades per a seed de la base de dades

const ESPLANADES = [
  { codi: 'E1', nom: 'Roca de molt bona qualitat', resistencia_min: 100, resistencia_max: null, k_min: 100, k_max: null, categories: ['TT1','TT2','TT3','TT4','TT5'] },
  { codi: 'E2', nom: 'Roca de bona qualitat', resistencia_min: 50, resistencia_max: 100, k_min: 50, k_max: 100, categories: ['TT1','TT2','TT3','TT4','TT5'] },
  { codi: 'E3', nom: 'Roca de qualitat mitjana', resistencia_min: 25, resistencia_max: 50, k_min: 25, k_max: 50, categories: ['TT1','TT2','TT3','TT4'] },
  { codi: 'E4', nom: 'Sòls granulars', resistencia_min: 5, resistencia_max: 25, k_min: 10, k_max: 25, categories: ['TT1','TT2','TT3'] },
  { codi: 'E5', nom: 'Sòls fins', resistencia_min: 0, resistencia_max: 5, k_min: 0, k_max: 10, categories: ['TT1','TT2'] }
];

const SECCIONS = [
  { codi: 'S1', nom: 'CR + CI + CB', capes: ['CR','CI','CB'], descripcio: 'Secció mínima' },
  { codi: 'S2', nom: 'CR + CI + CB + CS', capes: ['CR','CI','CB','CS'], descripcio: 'Secció amb subbase' },
  { codi: 'S3', nom: 'CR + CB + CS', capes: ['CR','CB','CS'], descripcio: 'Sense capa intermèdia' },
  { codi: 'S4', nom: 'CR + CI + CB + CS + CTR', capes: ['CR','CI','CB','CS','CTR'], descripcio: 'Amb tractament de fons' }
];

const COMBINACIONS = [
  // TT1
  { esplanada: 'E1', transit: 'TT1', seccions: ['S1','S2','S3'] },
  { esplanada: 'E2', transit: 'TT1', seccions: ['S1','S2','S3'] },
  { esplanada: 'E3', transit: 'TT1', seccions: ['S1','S2','S3'] },
  { esplanada: 'E4', transit: 'TT1', seccions: ['S1','S2','S3'] },
  { esplanada: 'E5', transit: 'TT1', seccions: ['S2','S3','S4'] },
  
  // TT2
  { esplanada: 'E1', transit: 'TT2', seccions: ['S1','S2'] },
  { esplanada: 'E2', transit: 'TT2', seccions: ['S1','S2'] },
  { esplanada: 'E3', transit: 'TT2', seccions: ['S1','S2'] },
  { esplanada: 'E4', transit: 'TT2', seccions: ['S1','S2'] },
  { esplanada: 'E5', transit: 'TT2', seccions: ['S2','S4'] },
  
  // TT3
  { esplanada: 'E1', transit: 'TT3', seccions: ['S1','S2'] },
  { esplanada: 'E2', transit: 'TT3', seccions: ['S1','S2'] },
  { esplanada: 'E3', transit: 'TT3', seccions: ['S1','S2'] },
  { esplanada: 'E4', transit: 'TT3', seccions: ['S2'] },
  { esplanada: 'E5', transit: 'TT3', seccions: ['S2','S4'] },
  
  // TT4
  { esplanada: 'E1', transit: 'TT4', seccions: ['S1','S2'] },
  { esplanada: 'E2', transit: 'TT4', seccions: ['S1','S2'] },
  { esplanada: 'E3', transit: 'TT4', seccions: ['S2'] },
  { esplanada: 'E4', transit: 'TT4', seccions: ['S2'] },
  { esplanada: 'E5', transit: 'TT4', seccions: ['S2','S4'] },
  
  // TT5
  { esplanada: 'E1', transit: 'TT5', seccions: ['S1','S2'] },
  { esplanada: 'E2', transit: 'TT5', seccions: ['S2'] },
  { esplanada: 'E3', transit: 'TT5', seccions: ['S2'] },
  { esplanada: 'E4', transit: 'TT5', seccions: ['S2'] },
  { esplanada: 'E5', transit: 'TT5', seccions: ['S4'] }
];
```

---

**Document per a seed de la base de dades**
**Font**: Norma 6.1 IC i PG-3
**Data**: 2025-01-XX
