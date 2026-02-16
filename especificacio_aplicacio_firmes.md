# ESPECIFICACIÓ TÈCNICA: CALCULADORA OPTIMITZADORA DE FERMES I CERTIFICATS AMBIENTALS

## 1. VISIÓ GENERAL DE L'APLICACIÓ

### 1.1 Objectius Principals
L'aplicació és una eina SaaS professional per a:
- **Optimització de solucions de ferm** des de tres perspectives: estructural, emissions (petjada de carboni) i econòmica
- **Generació automàtica de certificats ambientals de producte** per a fabricants de mescles bituminoses
- **Compliment integral de la normativa espanyola** (6.1 IC, 6.3 IC, PG-3, Ordres Circulars)

### 1.2 Tipologies de Projectes Suportats
1. **Firmes de nova construcció** (Norma 6.1 IC)
2. **Rehabilitació i reforç de ferms** (Norma 6.3 IC)
3. **Reciclats** (in situ i en central, segons OC 2023-02)
4. **Tecnologies avançades** (AUTL, segons OC 2022-03)

### 1.3 Funcionalitats Clau
- Georeferenciació d'obres, plantes d'asfalt i pedreres
- Càlcul automàtic de distàncies de transport (integració GIS)
- Generació de totes les combinacions possibles de capes (gruixos mínim 0,5cm)
- Algoritmes d'optimització multiobjectiu (Pareto, ponderació configurable)
- Certificats PDF amb i18n (català, castellà, anglès, francès)
- Base de dades versionable i actualitzable per l'administrador

---

## 2. ALGORITMES DE CÀLCUL ESTRUCTURAL (NORMA 6.1 IC I 6.3 IC)

### 2.1 Paràmetres d'Entrada

#### 2.1.1 Dades del Trànsit ( segons PG-3)
```
- Intensitat mitjana diària (IMD)
- Percentatge de vehicles pesants (%VP)
- Tipus de traçat (TT): TT1, TT2, TT3, TT4, TT5
- Zona climàtica (ZC): ZC1, ZC2, ZC3, ZC4
- Vida útil del projecte (anys)
- Creixement anual del trànsit (%)
```

#### 2.1.2 Dades de l'Esplanada
```
- Tipus de terreny fonament (roca, terra, etc.)
- Resistència a la compressió simple (MPa)
- Coeficient de reacció del fons (K)
- Humitat relativa del fons (%)
```

#### 2.1.3 Dades del Firme Existents (per a reforços)
```
- Estructura actual (capa per capa)
- Gruixos existents (cm)
- Tipologia de materials
- Estat de conservació (escàner de degradació)
- Càrrega equivalente actual (NEC)
```

### 2.2 Càlcul de la Necessitat Estructural (NEC)

#### 2.2.1 Fórmula Base (Mètode AASHTO adaptat)
```
NEC = f(IMD, %VP, TT, ZC, vida útil, creixement)

On:
- NEC = Nombre d'equivalències de càrrega (eixos estàndard de 80 kN)
- Es calcula com: NEC = 365 × IMD × %VP × FD × FE × FC
  - FD = Factor de distribució per carril
  - FE = Factor d'equivalència de danys
  - FC = Factor de creixement acumulat
```

#### 2.2.2 Factors de Correcció
```
- Factor ambiental (Zona climàtica)
- Factor de confiança (nivell de risc acceptable)
- Factor de drenatge (qualitat del drenatge del ferm)
```

### 2.3 Disseny Estructural de Capes

#### 2.3.1 Tipologies de Capa Permeses (6.1 IC)

**CAPA DE RODAMENT (CR):**
```
- Mescla bituminosa d'ús M (densa, semidensa, discontinua)
- Mescla bituminosa d'ús E (alta estabilitat, alta deformació)
- Mescla bituminosa d'ús A (alta deformació, baixa estabilitat)
- Mescla bituminosa d'ús S (alta estabilitat, baixa deformació)
- Mescla bituminosa d'ús T (alta deformació, alta estabilitat)
- Mescla bituminosa d'ús I (intermèdia)
```

**CAPA INTERMÈDIA (CI):**
```
- Mescla bituminosa d'ús M, E, A, S, T, I
- Macadams bituminosos
- Estabilitzats amb betum
```

**CAPA DE BASE (CB):**
```
- Mescla bituminosa d'ús G (granulometria oberta)
- Macadams bituminosos
- Estabilitzats amb betum
- Grava-estabilitzada amb ciment
- Grava natural compactada
```

**CAPA DE SUBBASE (CS):**
```
- Grava-estabilitzada amb ciment
- Grava natural compactada
- Sorra-estabilitzada amb ciment
- Materials granulars no tractats
```

#### 2.3.2 Gruixos Mínims i Màxims per Tipologia

```python
GRUIXOS_PER_TIPOLOGIA = {
    'CR': {'min': 4.0, 'max': 8.0, 'pas': 0.5},   # Capa de rodament
    'CI': {'min': 6.0, 'max': 12.0, 'pas': 0.5},  # Capa intermèdia
    'CB': {'min': 10.0, 'max': 20.0, 'pas': 0.5}, # Capa de base
    'CS': {'min': 15.0, 'max': 30.0, 'pas': 0.5}, # Capa de subbase
}
```

#### 2.3.3 Mòduls de Rigidesa i Resistències

```python
PROPIETATS_MATERIALS = {
    'AC16_Surf_50/70': {
        'E': 3500,      # Mòdul elàstic (MPa)
        'nu': 0.35,     # Coeficient de Poisson
        'R_flex': 1.5,  # Resistència a flexió (MPa)
        'R_comp': 15.0, # Resistència a compressió (MPa)
    },
    'AC22_Base_50/70': {
        'E': 3000,
        'nu': 0.35,
        'R_flex': 1.2,
        'R_comp': 12.0,
    },
    'AC16_Surf_S_50/70_20RA': {
        'E': 3200,      # Amb 20% RA
        'nu': 0.35,
        'R_flex': 1.3,
        'R_comp': 13.0,
    },
    'AUTL': {
        'E': 2500,      # Asfaltos ultra-templados
        'nu': 0.35,
        'R_flex': 1.0,
        'R_comp': 10.0,
    },
    'G_EB_20': {       # Grava-estabilitzada amb betum
        'E': 2500,
        'nu': 0.40,
        'R_flex': 0.8,
        'R_comp': 8.0,
    },
    'G_CEM_III': {     # Grava amb ciment CEM III
        'E': 2000,
        'nu': 0.25,
        'R_flex': 0.6,
        'R_comp': 6.0,
    },
    'GN': {            # Grava natural
        'E': 400,
        'nu': 0.45,
        'R_flex': 0.0,
        'R_comp': 0.0,
    },
}
```

### 2.4 Algoritme de Càlcul Estructural (Mètode Multicapa)

#### 2.4.1 Model de Càlcul (BISAR 3.0 / ELSYM5)
```
El càlcul es basa en la teoria de la flexió de plaques sobre fons elàstic:

1. Modelització del ferm com a sistema multicapa
2. Càlcul de tensions i deformacions a cada interfície
3. Verificació de criteris de fallada per fatiga i aixecament
```

#### 2.4.2 Criteris de Fallada

**FATIGA POR FLEXION (Capes bituminoses):**
```
N_fatiga = k1 × (1/εt)^k2 × (1/E)^k3 × (1/h)^k4

On:
- εt = Deformació de tracció a la base de la capa
- E = Mòdul elàstic del material
- h = Gruix de la capa
- k1, k2, k3, k4 = Coeficients experimentals
```

**AIXECAMENT PER CORTANT (Subbase i fonament):**
```
N_rutting = C × (1/εc)^n

On:
- εc = Deformació de compressió vertical
- C, n = Coeficients materials
```

#### 2.4.3 Verificació Estructural
```python
def verificar_estructura(capes, NEC, propietats_fons):
    """
    Verifica si una estructura de ferm compleix els requisits
    """
    resultats = {
        'viable': True,
        'fatiga_CR': 0,
        'fatiga_CI': 0,
        'aixecament': 0,
        'deformacio_total': 0,
        'ratio_fatiga': 0,
        'ratio_aixecament': 0
    }
    
    # 1. Càlcul de tensions i deformacions (BISAR)
    tensions = calcular_tensions_BISAR(capes, propietats_fons)
    
    # 2. Càlcul de cicles de fatiga admissibles
    for capa in capes:
        if capa.tipus in ['CR', 'CI']:
            N_adm = calcular_fatiga_flexio(tensions[capa.id], capa.material)
            ratio = NEC / N_adm
            resultats[f'fatiga_{capa.tipus}'] = ratio
            resultats['ratio_fatiga'] = max(resultats['ratio_fatiga'], ratio)
    
    # 3. Càlcul de cicles d'aixecament admissibles
    N_aix = calcular_aixecament(tensions['subbase'], propietats_fons)
    resultats['ratio_aixecament'] = NEC / N_aix
    
    # 4. Verificació de deformació total
    resultats['deformacio_total'] = calcular_deformacio_total(tensions)
    
    # 5. Determinar viabilitat
    if (resultats['ratio_fatiga'] > 1.0 or 
        resultats['ratio_aixecament'] > 1.0 or
        resultats['deformacio_total'] > 25):  # mm
        resultats['viable'] = False
    
    return resultats
```

### 2.5 Generació de Combinacions de Capes

#### 2.5.1 Algoritme de Combinacions
```python
def generar_combinacions_capes(tipologia, gruixos_min, gruixos_max, pas):
    """
    Genera totes les combinacions possibles de capes per a una tipologia
    """
    combinacions = []
    
    # Per cada tipus de capa permesa
    for tipus_capa in TIPOLOGIES_PERMESA[tipologia]:
        # Per cada material permès per aquesta capa
        for material in MATERIALS_PER_TIPUS[tipus_capa]:
            # Per cada gruix possible
            gruix = gruixos_min[tipus_capa]
            while gruix <= gruixos_max[tipus_capa]:
                combinacions.append({
                    'tipus': tipus_capa,
                    'material': material,
                    'gruix': gruix
                })
                gruix += pas
    
    return combinacions
```

#### 2.5.2 Estructures Completes
```python
def generar_estructures_completes(NEC, tipus_firme, restriccions):
    """
    Genera totes les estructures possibles que compleixen la NEC
    """
    estructures_viables = []
    
    # Generar combinacions per cada capa
    combinacions_CR = generar_combinacions_capes('CR', restriccions)
    combinacions_CI = generar_combinacions_capes('CI', restriccions)
    combinacions_CB = generar_combinacions_capes('CB', restriccions)
    combinacions_CS = generar_combinacions_capes('CS', restriccions)
    
    # Combinar totes les opcions
    for cr in combinacions_CR:
        for ci in combinacions_CI:
            for cb in combinacions_CB:
                for cs in combinacions_CS:
                    estructura = [cr, ci, cb, cs]
                    
                    # Verificar si compleix estructuralment
                    resultat = verificar_estructura(estructura, NEC, restriccions.fons)
                    
                    if resultat['viable']:
                        estructures_viables.append({
                            'estructura': estructura,
                            'resultat': resultat,
                            'gruix_total': sum(c['gruix'] for c in estructura)
                        })
    
    return estructures_viables
```

### 2.6 Optimització Estructural

#### 2.6.1 Funció Objectiu Estructural
```python
def funcio_objectiu_estructural(estructura, resultat):
    """
    Avalua la qualitat d'una solució des del punt de vista estructural
    """
    # Minimitzar el gruix total
    gruix_total = sum(capa['gruix'] for capa in estructura)
    
    # Minimitzar el cost estructural (aproximació)
    cost_estructural = calcular_cost_materials(estructura)
    
    # Maximitzar el marge de seguretat
    marge_seguretat = min(
        1.0 / resultat['ratio_fatiga'],
        1.0 / resultat['ratio_aixecament']
    )
    
    # Funció objectiu combinada (minimitzar)
    return (
        0.4 * normalitzar(gruix_total) +
        0.3 * normalitzar(cost_estructural) +
        0.3 * (1.0 / marge_seguretat)
    )
```

---

## 3. ALGORITMES DE CÀLCUL D'EMISSIONS (PETJADA DE CARBONI)

### 3.1 Metodologia General (OC 3/2024)

L'aplicació segueix la metodologia de l'Ordre Circular 3/2024 per al càlcul de la petjada de carboni de les etapes A1 a A5 segons la norma UNE-EN 15804+A2.

#### 3.1.1 Etapes del Cicle de Vida
```
A1 - Producció de materials
A2 - Transport de materials
A3 - Fabricació de la mescla bituminosa
A4 - Transport de la mescla bituminosa
A5 - Puesta en obra
```

### 3.2 Càlcul d'Emissions per Etapa

#### 3.2.1 Etapa A1: Producció de Materials

**Fórmula General:**
```
E_A1 = Σ (m_i × FE_i)

On:
- m_i = Massa del material i (kg/t de mescla)
- FE_i = Factor d'emissió del material i (kg CO2e/kg)
```

**Materials i Factors d'Emissió (Base de Dades):**
```python
FACTORS_EMISSIO_A1 = {
    # Àrids
    'arido_natural': {'FE': 4.48, 'font': 'DAP FdA (AN, 2022)', 'unitat': 'kg CO2e/t'},
    'arido_siderurgico': {'FE': 3.69, 'font': 'DAP FdA (AA, 2022)', 'unitat': 'kg CO2e/t'},
    
    # Pols mineral
    'polvo_caco3': {'FE': 4.48, 'font': 'DAP FdA (AN, 2022)', 'unitat': 'kg CO2e/t'},
    'polvo_caoh2': {'FE': 300.32, 'font': 'DAP EULA (2024)', 'unitat': 'kg CO2e/t'},
    'polvo_cemento': {'FE': 427.8, 'font': 'DAP IECA (CEM III, 2023)', 'unitat': 'kg CO2e/t'},
    
    # RA (Reutilització d'asfalt)
    'RA_tratado': {'FE': 2.16, 'font': 'DAP FdA (AN, 2023)', 'unitat': 'kg CO2e/t'},
    
    # Betums i emulsions
    'betun_convencional': {'FE': 272.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'betun_PNFVU': {'FE': 254.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'betun_PMB': {'FE': 465.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'betun_PMB_caucho': {'FE': 359.5, 'font': 'Deducció híbrida', 'unitat': 'kg CO2e/t'},
    'emulsion_C60B4': {'FE': 227.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'emulsion_C65B4': {'FE': 227.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'emulsion_C60B5': {'FE': 227.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    'emulsion_C65B5': {'FE': 227.0, 'font': 'DAP REPSOL (2020)', 'unitat': 'kg CO2e/t'},
    
    # Fibras i aditius
    'fibras_celulosa': {'FE': 229.0, 'font': 'LCA TOPCEL, CFF', 'unitat': 'kg CO2e/t'},
    'aditivo_semicalefacto': {'FE': 1190.0, 'font': 'SEVE V4.0 (2022)', 'unitat': 'kg CO2e/t'},
    
    # RARx (Pols de neumàtics)
    'RARx_caco3': {'FE': -141.0, 'font': 'DAP CIRTEC (2024)', 'unitat': 'kg CO2e/t'},
    'RARx_caoh2': {'FE': -59.6, 'font': 'DAP CIRTEC (2024)', 'unitat': 'kg CO2e/t'},
    'RARx_tyrexol': {'FE': -1060.3, 'font': 'Draft EPD RENECAL (2025)', 'unitat': 'kg CO2e/t'},
    
    # Conglomerants hidràulics
    'cal_hidratada': {'FE': 892.0, 'font': 'EULA (2024)', 'unitat': 'kg CO2e/t'},
    'cemento_CEM_I': {'FE': 778.0, 'font': 'DAP IECA (2023)', 'unitat': 'kg CO2e/t'},
    'cemento_CEM_II': {'FE': 649.8, 'font': 'DAP IECA (2023)', 'unitat': 'kg CO2e/t'},
    'cemento_CEM_III': {'FE': 427.8, 'font': 'DAP IECA (2023)', 'unitat': 'kg CO2e/t'},
}
```

#### 3.2.2 Etapa A2: Transport de Materials

**Fórmula General:**
```
E_A2 = Σ (m_i × d_i × FE_transport)

On:
- m_i = Massa del material i (kg/t de mescla)
- d_i = Distància de transport (km)
- FE_transport = Factor d'emissió del vehicle (kg CO2e/t·km)
```

**Tipus de Vehicles i Factors d'Emissió:**
```python
FACTORS_EMISSIO_TRANSPORT = {
    'camion_semirremolque_28t': {
        'FE': 0.0849,
        'font': 'SEVE V4.0 (2022)',
        'us': 'Àrids, RA i mescla bituminosa',
        'carga_util': 28  # tonnes
    },
    'camion_rigido_9t': {
        'FE': 0.17,
        'font': 'SEVE V4.0 (2022)',
        'us': 'Fibras, PNFVU i aditius',
        'carga_util': 9
    },
    'camion_cisterna_24t': {
        'FE': 0.0881,
        'font': 'SEVE V4.0 (2022)',
        'us': 'Betum i pols mineral',
        'carga_util': 24
    },
}
```

**Càlcul de Distàncies:**
```python
def calcular_distancia_transport(origen, desti, mode='carretera'):
    """
    Calcula la distància de transport entre dos punts georeferenciats
    """
    if mode == 'carretera':
        # Usar API de mapes (OpenStreetMap, Google Maps, etc.)
        distancia = api_maps.get_route_distance(origen, desti)
    elif mode == 'lineal':
        # Distància lineal amb factor corrector
        dist_lineal = calcular_distancia_haversine(origen, desti)
        distancia = dist_lineal * FACTOR_CORRECTOR_CARRETERA  # ~1.3
    
    return distancia
```

#### 3.2.3 Etapa A3: Fabricació de la Mescla Bituminosa

**3.2.3.1 Demanda Energètica Neta (Model Termodinàmic)**

La demanda energètica es calcula a partir de la variació d'entalpia:

```
ΔH = Σ (m_i × Ce_i × ΔT_i) + m_j × C_W

On:
- m_i = Massa de cada component (kg)
- Ce_i = Calor específic del component i (kJ/kg·K)
- ΔT_i = Increment de temperatura del component i (K)
- m_j = Massa d'aigua a evaporar (kg)
- C_W = Calor latent de vaporització de l'aigua (kJ/kg)
```

**Constants Calorífiques:**
```python
CONSTANTS_CALORIFIQUES = {
    'aridos_naturales': {'Ce': 0.835, 'unitat': 'kJ/kg·K'},
    'arido_siderurgico': {'Ce': 0.78, 'unitat': 'kJ/kg·K'},
    'betun': {'Ce': 2.093, 'unitat': 'kJ/kg·K'},
    'RA': {'Ce': 0.89161, 'unitat': 'kJ/kg·K'},
    'aigua': {'Ce': 4.184, 'unitat': 'kJ/kg·K'},
    'calor_vaporitzacio': {'C_W': 2.25, 'unitat': 'MJ/kg'},
}
```

**3.2.3.2 Demanda Energètica Bruta (Consum de Combustible)**

```
D_c = (1 / (1 - p)) × ((ΔH + P) / PCI)

On:
- D_c = Consum de combustible (kg o GJ)
- p = Pèrdues de calor en els productes de combustió i radiació (%)
- P = Pèrdues per rendiment de la central (MJ)
- PCI = Poder calorífic inferior del combustible (MJ/kg o MJ/GJ)
```

**Poder Calorífic i Factors d'Emissió de Combustibles:**
```python
COMBUSTIBLES = {
    'gasoleo': {
        'PCI': 43.0,           # MJ/kg
        'FE': 3.17,            # kg CO2e/kg
        'font': 'SEVE V4.0 (2022)'
    },
    'fueloleo': {
        'PCI': 40.4,           # MJ/kg
        'FE': 93.2,            # kg CO2e/GJ
        'font': 'Informe Inventaris GEI + Ecoinvent 3.11'
    },
    'gas_natural': {
        'PCI': 48.31,          # MJ/kg
        'FE': 70.19,           # kg CO2e/GJ
        'font': 'Informe Inventaris GEI + Ecoinvent 3.12'
    },
}
```

**3.2.3.3 Consum Elèctric**

```python
CONSUM_ELECTRIC = {
    'motors_central': {
        'consum': 1.5,         # kWh/t
        'FE_red': 0.283,       # kg CO2e/kWh (MITERD 2024, mix sense GdO)
        'FE_grupo': 0.84956,   # kg CO2e/kWh (EPA 2010)
    },
    'calentament_ligants': {
        'consum': 0.5,         # kWh/t
        'FE_red': 0.283,
        'FE_caldera': 0.94466, # kg CO2e/kWh (EPA 2010)
    },
}
```

**3.2.3.4 Pala Carregadora**

```python
PALA_CARREGADORA = {
    'rendiment': 0.0129,       # h/t (configurable)
    'FE': 71.78,               # kg CO2e/h
    'font': 'SEVE Eco-comparateur 4.0',
}
```

**3.2.3.5 Càlcul Total d'Emissions A3:**
```python
def calcular_emissions_A3(parametres):
    """
    Calcula les emissions de l'etapa A3 (fabricació)
    """
    # 1. Demanda energètica neta
    delta_H = calcular_variacio_entalpia(parametres)
    
    # 2. Demanda energètica bruta
    p = parametres.perdues_calor / 100  # %
    P = parametres.perdues_rendiment    # MJ
    PCI = COMBUSTIBLES[parametres.combustible]['PCI']
    
    D_c = (1 / (1 - p)) * ((delta_H + P) / PCI)
    
    # 3. Emissions del combustible
    FE_combustible = COMBUSTIBLES[parametres.combustible]['FE']
    if parametres.combustible == 'fueloleo':
        E_combustible = D_c * FE_combustible  # D_c en GJ
    else:
        E_combustible = D_c * FE_combustible  # D_c en kg
    
    # 4. Emissions elèctriques
    consum_total = CONSUM_ELECTRIC['motors_central']['consum']
    if parametres.font_electrica == 'red':
        FE_elec = CONSUM_ELECTRIC['motors_central']['FE_red']
    else:
        FE_elec = CONSUM_ELECTRIC['motors_central']['FE_grupo']
    E_electric = consum_total * FE_elec
    
    # 5. Emissions caldera
    if parametres.font_calentament == 'caldera':
        consum_caldera = CONSUM_ELECTRIC['calentament_ligants']['consum']
        FE_caldera = CONSUM_ELECTRIC['calentament_ligants']['FE_caldera']
        E_caldera = consum_caldera * FE_caldera
    else:
        E_caldera = 0
    
    # 6. Emissions pala carregadora
    E_pala = PALA_CARREGADORA['rendiment'] * PALA_CARREGADORA['FE']
    
    # Total A3
    E_A3 = E_combustible + E_electric + E_caldera + E_pala
    
    return {
        'E_A3': E_A3,
        'desglossament': {
            'combustible': E_combustible,
            'electric': E_electric,
            'caldera': E_caldera,
            'pala': E_pala
        }
    }
```

#### 3.2.4 Etapa A4: Transport de la Mescla Bituminosa

**Fórmula:**
```
E_A4 = m_mb × d × FE_transport

On:
- m_mb = Massa de mescla bituminosa (kg/t, incloent mermes)
- d = Distància central-obra (km)
- FE_transport = Factor d'emissió del vehicle (kg CO2e/t·km)
```

**Consideracions:**
- Incloure mermes de puesta en obra (tipicament 2%)
- Vehicle: Camió amb semiremolque 28t de càrrega útil
- Tornada en buit

#### 3.2.5 Etapa A5: Puesta en Obra

**Equipos i Factors d'Emissió:**
```python
EQUIPS_POSADA_EN_OBRA = {
    'silo_transferencia': {
        'FE': 147.8,           # kg CO2e/h
        'rendiment': 0.008,    # h/t (configurable)
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'extendedora': {
        'FE': 117.085,
        'rendiment': 0.008,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'compactador_tandem_11t': {
        'FE': 34.0,
        'rendiment': 0.008,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'compactador_neumaticos_21t': {
        'FE': 55.82,
        'rendiment': 0.008,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'compactador_tandem_15t': {
        'FE': 51.18,
        'rendiment': 0.004,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'compactador_neumaticos_35t': {
        'FE': 65.8676,
        'rendiment': 0.004,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'minibarredora': {
        'FE': 25.043,
        'rendiment': 0.004,
        'font': 'OC 4/2023',
    },
    'fresadora_1m': {
        'FE': 124.35714,
        'rendiment': 0.001,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'fresadora_2_2m': {
        'FE': 266.4,
        'rendiment': 0.004,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'fresadora_0_35m': {
        'FE': 30.44286,
        'rendiment': 0.004,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'recicladora': {
        'FE': 386.9,
        'rendiment': 0.004,
        'font': 'SEVE Eco-comparateur 4.0',
    },
    'camion_bascualnte': {
        'FE': 159.2,
        'rendiment': 0.001,
        'font': 'SEVE Eco-comparateur 4.0',
    },
}
```

**Càlcul d'Emissions A5:**
```python
def calcular_emissions_A5(equips_utilitzats):
    """
    Calcula les emissions de l'etapa A5 (puesta en obra)
    """
    E_A5 = 0
    desglossament = {}
    
    for equip, hores in equips_utilitzats.items():
        FE = EQUIPS_POSADA_EN_OBRA[equip]['FE']
        emissions = hores * FE
        E_A5 += emissions
        desglossament[equip] = emissions
    
    return {
        'E_A5': E_A5,
        'desglossament': desglossament
    }
```

### 3.3 Càlcul Total de la Petjada de Carboni

```python
def calcular_petjada_carboni_total(dades):
    """
    Calcula la petjada de carboni total d'una mescla bituminosa
    """
    # A1: Producció de materials
    E_A1 = calcular_emissions_A1(dades.composicio, dades.factors_emissio)
    
    # A2: Transport de materials
    E_A2 = calcular_emissions_A2(dades.composicio, dades.distancies)
    
    # A3: Fabricació
    E_A3 = calcular_emissions_A3(dades.parametres_fabricacio)
    
    # A4: Transport de mescla
    E_A4 = calcular_emissions_A4(dades.distancia_central_obra, dades.mermes)
    
    # A5: Puesta en obra
    E_A5 = calcular_emissions_A5(dades.equips_posada_en_obra)
    
    # Total
    E_total = E_A1 + E_A2 + E_A3 + E_A4 + E_A5
    
    return {
        'E_total_kg_CO2e_t': E_total,
        'desglossament': {
            'A1': E_A1,
            'A2': E_A2,
            'A3': E_A3,
            'A4': E_A4,
            'A5': E_A5,
        },
        'percentatges': {
            'A1': E_A1 / E_total * 100,
            'A2': E_A2 / E_total * 100,
            'A3': E_A3 / E_total * 100,
            'A4': E_A4 / E_total * 100,
            'A5': E_A5 / E_total * 100,
        }
    }
```

### 3.4 Càlcul per m² de Secció Completa

```python
def calcular_emissions_per_m2(emissions_per_tona, gruix_cm, densitat_t_m3):
    """
    Converteix emissions per tona a emissions per m²
    """
    # Volum per m² (m³/m²)
    volum = gruix_cm / 100  # cm a m
    
    # Massa per m² (t/m²)
    massa = volum * densitat_t_m3
    
    # Emissions per m²
    emissions_m2 = emissions_per_tona * massa
    
    return emissions_m2
```

---

## 4. ALGORITMES D'OPTIMITZACIÓ MULTIOBJECTIU

### 4.1 Funcions Objectiu

L'aplicació optimitza simultàniament tres objectius:

#### 4.1.1 Objectiu 1: Estructural (Minimitzar)
```python
def F_estructural(estructura, resultat_verificacio):
    """
    Funció objectiu estructural
    """
    # Gruix total (cm)
    gruix_total = sum(capa['gruix'] for capa in estructura)
    
    # Cost dels materials (€/m²) - aproximació
    cost_materials = calcular_cost_materials(estructura)
    
    # Marge de seguretat (inversament proporcional)
    marge_seguretat = min(
        1.0 / resultat_verificacio['ratio_fatiga'],
        1.0 / resultat_verificacio['ratio_aixecament']
    )
    
    # Funció objectiu normalitzada
    F1 = (
        0.4 * normalitzar(gruix_total, 'gruix') +
        0.3 * normalitzar(cost_materials, 'cost') +
        0.3 * (1.0 / marge_seguretat)
    )
    
    return F1
```

#### 4.1.2 Objectiu 2: Emissions (Minimitzar)
```python
def F_emissions(estructura, distancies, parametres_fabricacio):
    """
    Funció objectiu d'emissions
    """
    # Calcular emissions per cada capa
    emissions_total = 0
    
    for capa in estructura:
        # Emissions de la capa (A1-A5)
        emissions_capa = calcular_emissions_capa(
            capa, 
            distancies[capa.material],
            parametres_fabricacio
        )
        emissions_total += emissions_capa
    
    return emissions_total
```

#### 4.1.3 Objectiu 3: Econòmic (Minimitzar)
```python
def F_economic(estructura, preus, distancies, costos_transport):
    """
    Funció objectiu econòmic
    """
    cost_total = 0
    
    for capa in estructura:
        # Cost del material (€/t)
        cost_material = preus[capa.material] * capa.gruix * capa.densitat / 100
        
        # Cost de transport (€/t)
        cost_transport = costos_transport[capa.material] * distancies[capa.material]
        
        # Cost de fabricació i posada en obra (€/t)
        cost_fabricacio = preus['fabricacio']
        cost_posada_en_obra = preus['posada_en_obra']
        
        cost_total += cost_material + cost_transport + cost_fabricacio + cost_posada_en_obra
    
    return cost_total
```

### 4.2 Algoritmes d'Optimització

#### 4.2.1 Algoritme 1: Ponderació Configurable (Weighted Sum Method)
```python
def optimitzar_ponderacio(estructures_viables, pesos, distancies, preus):
    """
    Optimitza utilitzant ponderació configurable dels objectius
    
    pesos = {'estructural': w1, 'emissions': w2, 'economic': w3}
    """
    millor_solucio = None
    millor_valor = float('inf')
    
    for estructura in estructures_viables:
        # Avaluar cada funció objectiu
        f1 = F_estructural(estructura['estructura'], estructura['resultat'])
        f2 = F_emissions(estructura['estructura'], distancies, parametres)
        f3 = F_economic(estructura['estructura'], preus, distancies, costos)
        
        # Funció objectiu ponderada
        F_total = (
            pesos['estructural'] * f1 +
            pesos['emissions'] * f2 +
            pesos['economic'] * f3
        )
        
        if F_total < millor_valor:
            millor_valor = F_total
            millor_solucio = estructura
    
    return millor_solucio
```

#### 4.2.2 Algoritme 2: Frontera de Pareto (NSGA-II)
```python
def optimitzar_pareto(estructures_viables, distancies, preus):
    """
    Genera la frontera de Pareto de solucions no dominades
    """
    # Avaluar totes les estructures
    solucions = []
    for estructura in estructures_viables:
        solucio = {
            'estructura': estructura,
            'f1': F_estructural(estructura['estructura'], estructura['resultat']),
            'f2': F_emissions(estructura['estructura'], distancies, parametres),
            'f3': F_economic(estructura['estructura'], preus, distancies, costos),
        }
        solucions.append(solucio)
    
    # Trobar solucions no dominades (Pareto)
    frontera_pareto = []
    for sol_i in solucions:
        dominada = False
        for sol_j in solucions:
            if sol_i != sol_j:
                # sol_j domina sol_i?
                if (sol_j['f1'] <= sol_i['f1'] and 
                    sol_j['f2'] <= sol_i['f2'] and 
                    sol_j['f3'] <= sol_i['f3'] and
                    (sol_j['f1'] < sol_i['f1'] or 
                     sol_j['f2'] < sol_i['f2'] or 
                     sol_j['f3'] < sol_i['f3'])):
                    dominada = True
                    break
        
        if not dominada:
            frontera_pareto.append(sol_i)
    
    return frontera_pareto
```

#### 4.2.3 Algoritme 3: Anàlisi de Sensibilitat
```python
def analisi_sensibilitat(estructures_viables, distancies, preus):
    """
    Realitza anàlisi de sensibilitat variant els pesos dels objectius
    """
    resultats = []
    
    # Variar pesos en increments del 10%
    for w1 in range(0, 101, 10):  # Estructural
        for w2 in range(0, 101 - w1, 10):  # Emissions
            w3 = 100 - w1 - w2  # Economic
            
            pesos = {
                'estructural': w1 / 100,
                'emissions': w2 / 100,
                'economic': w3 / 100
            }
            
            solucio = optimitzar_ponderacio(estructures_viables, pesos, distancies, preus)
            
            resultats.append({
                'pesos': pesos,
                'solucio': solucio
            })
    
    return resultats
```

### 4.3 Solucions Òptimes Proposades

L'aplicació proposarà automàticament:

1. **Solució Òptima Estructural**: Mínim gruix que compleix la NEC
2. **Solució Òptima Ambiental**: Mínimes emissions de CO2
3. **Solució Òptima Econòmica**: Mínim cost total
4. **Solució Òptima Combinada**: Millor compromís (segons ponderació per defecte o configurada)

---

## 5. CERTIFICATS AMBIENTALS DE PRODUCTE

### 5.1 Procés de Generació de Certificats

#### 5.1.1 Dades Requerides del Fabricant
```
- Catàleg de solucions (tipus de mescles, formulacions)
- Ubicació de la planta de fabricació
- Origen dels materials (pedreres, proveïdors de betum, etc.)
- Processos de fabricació (temperatures, combustibles, etc.)
- Equips de puesta en obra habituals
```

#### 5.1.2 Dades de l'Obra (per al certificat)
```
- Ubicació de l'obra (georeferenciada)
- Distàncies de transport (calculades automàticament)
- Volum de mescla requerit
- Tipologia de puesta en obra
```

### 5.2 Verificació de Compliment Normatiu

```python
def verificar_compliment_normatiu(emissions, tipologia_mescla):
    """
    Verifica si les emissions compleixen els requisits de l'OC 3/2024
    """
    # Límits d'emissions segons tipologia (valors orientatius)
    LIMITS = {
        'MBC_convencional': {'A1_A5': 70.0},  # kg CO2e/t
        'MBC_amb_RA': {'A1_A5': 60.0},
        'MBT': {'A1_A5': 55.0},
        'AUTL': {'A1_A5': 45.0},
    }
    
    limit = LIMITS.get(tipologia_mescla, {'A1_A5': 70.0})
    
    compleix = emissions['E_total'] <= limit['A1_A5']
    
    return {
        'compleix': compleix,
        'emissions_calculades': emissions['E_total'],
        'limit_aplicable': limit['A1_A5'],
        'marge': limit['A1_A5'] - emissions['E_total'],
        'percentatge_sobre_limit': (emissions['E_total'] / limit['A1_A5']) * 100
    }
```

### 5.3 Generació del PDF del Certificat

El certificat inclourà:
1. **Portada**: Identificació del fabricant, producte i obra
2. **Resum Executiu**: Resultats principals i compliment normatiu
3. **Desglossament per Etapes**: A1, A2, A3, A4, A5 amb taules i gràfics
4. **Metodologia**: Referències normatives i fonts de dades
5. **Annex de Càlcul**: Detall complet de les fórmules i valors utilitzats
6. **Signatures i Validesa**: Data d'emissió i període de validesa

---

## 6. ARQUITECTURA DE L'APLICACIÓ

### 6.1 Arquitectura SaaS Multi-Tenant

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTACIÓN                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Web App   │  │   Mobile    │  │      API REST           │  │
│  │  (React)    │  │   (PWA)     │  │    (GraphQL/REST)       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         LÓGICA DE NEGOCIO                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Módulo de  │  │  Módulo de  │  │   Módulo de Certificados │  │
│  │  Proyectos  │  │  Cálculos   │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Módulo de  │  │  Módulo de  │  │   Módulo de Reportes    │  │
│  │  Optimización│  │  GIS/Mapas  │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                          SERVICIOS                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Servicio   │  │  Servicio   │  │   Servicio de PDF       │  │
│  │  de Cálculo │  │  de GIS     │  │                         │  │
│  │  Estructural│  │  (OpenStreet)│  │   (PDFKit/jsPDF)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Servicio   │  │  Servicio   │  │   Servicio de i18n      │  │
│  │  de Emisiones│  │  de Precios │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                         BASE DE DATOS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  PostgreSQL │  │    Redis    │  │   Almacenamiento de     │  │
│  │  (Datos     │  │   (Caché)   │  │   Archivos (S3)         │  │
│  │   maestros) │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Model de Dades Principal

#### 6.2.1 Entitats Core

```python
# Usuaris i Organitzacions
class Organitzacio:
    id: UUID
    nom: str
    tipus: str  # 'fabricant', 'consultoria', 'administracio'
    nif: str
    adreca: Address
    created_at: datetime

class Usuari:
    id: UUID
    email: str
    nom: str
    cognoms: str
    organitzacio_id: UUID
    rol: str  # 'admin', 'projectista', 'fabricant', 'lector'
    idioma_preferit: str  # 'ca', 'es', 'en', 'fr'
    created_at: datetime

# Projectes
class Projecte:
    id: UUID
    codi: str
    denominacio: str
    descripcio: str
    organitzacio_id: UUID
    propietari_id: UUID
    estat: str  # 'esborrany', 'actiu', 'completat', 'arxiuat'
    
    # Dades del trànsit
    imd: int
    percentatge_vp: float
    tipus_tracat: str  # 'TT1', 'TT2', 'TT3', 'TT4', 'TT5'
    zona_climatica: str  # 'ZC1', 'ZC2', 'ZC3', 'ZC4'
    vida_util: int
    creixement_anual: float
    
    # Georeferenciació
    ubicacio_obra: GeoPoint
    geometries: GeoJSON
    
    created_at: datetime
    updated_at: datetime

# Estructures de Ferm
class EstructuraFirme:
    id: UUID
    projecte_id: UUID
    nom: str
    descripcio: str
    tipus: str  # 'nova_construccio', 'reforc', 'reciclatge'
    
    # Resultats d'optimització
    pesos_utilitzats: Dict[str, float]
    es_optima_estructural: bool
    es_optima_emissions: bool
    es_optima_economica: bool
    es_optima_combinada: bool
    
    created_at: datetime

class CapaFirme:
    id: UUID
    estructura_id: UUID
    ordre: int
    tipus: str  # 'CR', 'CI', 'CB', 'CS'
    material_id: UUID
    gruix_cm: float
    densitat_t_m3: float
    
    # Propietats calculades
    modul_elastic_mpa: float
    resistencia_flexio_mpa: float
    resistencia_compresio_mpa: float

# Materials
class Material:
    id: UUID
    codi: str
    nom: str
    tipus: str  # 'mescla_bituminosa', 'macadam', 'estabilitzat', 'grava'
    
    # Propietats estructurals
    modul_elastic_mpa: float
    coeficient_poisson: float
    resistencia_flexio_mpa: float
    resistencia_compresio_mpa: float
    densitat_t_m3: float
    
    # Propietats ambientals (A1)
    factor_emissio_a1: float
    font_factor_emissio: str
    
    # Preus
    preu_base_eur_t: float
    moneda: str
    
    # Metadades
    versio: int
    actiu: bool
    created_at: datetime
    updated_at: datetime

# Mescles Bituminoses (per a certificats)
class MesclaBituminosa:
    id: UUID
    fabricant_id: UUID
    nom_comercial: str
    tipus: str  # 'MBC', 'MBT', 'MBSC', 'AUTL'
    
    # Composició
    composicio: List[ComponentMescla]
    
    # Paràmetres de fabricació
    temperatura_descarrega_c: float
    temperatura_acopis_c: float
    humedat_aridos_percent: float
    humedat_ra_percent: float
    combustible: str
    font_electrica: str
    font_calentament: str
    
    # Emissions calculades (A1-A5)
    emissions_a1: float
    emissions_a2: float
    emissions_a3: float
    emissions_a4: float
    emissions_a5: float
    emissions_total: float
    
    created_at: datetime

class ComponentMescla:
    id: UUID
    mescla_id: UUID
    material_id: UUID
    percentatge: float  # % en pes
    distancia_transport_km: float
    tipus_vehicle: str

# Certificats Ambientals
class CertificatAmbiental:
    id: UUID
    codi: str
    mescla_id: UUID
    obra_id: UUID
    fabricant_id: UUID
    
    # Dades de l'obra
    ubicacio_obra: GeoPoint
    distancia_central_obra_km: float
    volum_mescla_t: float
    
    # Resultats
    emissions_a1: float
    emissions_a2: float
    emissions_a3: float
    emissions_a4: float
    emissions_a5: float
    emissions_total_kg_co2e_t: float
    emissions_total_kg_co2e_m2: float
    
    # Verificació
    compleix_normativa: bool
    limit_aplicable: float
    marge_sobre_limit: float
    
    # Document
    pdf_url: str
    data_emissio: datetime
    data_caducitat: datetime
    estat: str  # 'esborrany', 'emes', 'revocat'

# Ubicacions (Plantes, Pedreres, etc.)
class Ubicacio:
    id: UUID
    organitzacio_id: UUID
    nom: str
    tipus: str  # 'planta_asfalt', 'pedrera', 'proveidor_betum', 'obra'
    adreca: Address
    coordenades: GeoPoint
    actiu: bool

# Preus i Tarifes
class PreuMaterial:
    id: UUID
    material_id: UUID
    font_preus: str  # 'DGC', 'BEDEC', 'TCQ2000', 'personalitzat'
    versio_font: str
    preu_eur_t: float
    data_inici: datetime
    data_fi: datetime
    actiu: bool

class CostTransport:
    id: UUID
    tipus_vehicle: str
    cost_eur_tkm: float
    font: str
    versio: int
```

### 6.3 Sistema de Versions de Base de Dades

```python
class VersioBaseDades:
    id: UUID
    numero: str  # '2024.1', '2024.2', etc.
    data_publicacio: datetime
    descripcio: str
    canvis: List[CanviVersion]
    
    # Estat
    estat: str  # 'esborrany', 'publicada', 'obsoleta'
    es_actual: bool
    
    # Fitxers font
    fitxers_font: List[str]  # URLs dels CSV/Excel carregats
    
    created_by: UUID
    created_at: datetime

class CanviVersion:
    id: UUID
    versio_id: UUID
    tipus_entitat: str  # 'material', 'preu', 'factor_emissio'
    entitat_id: UUID
    tipus_canvi: str  # 'creat', 'modificat', 'eliminat'
    valors_anteriors: Dict
    valors_nous: Dict
```

### 6.4 Seguretat i Encriptació de la Base de Dades

```python
# Estratègia de protecció de dades sensibles
"""
1. La base de dades PostgreSQL estarà allotjada en servidors segurs
2. Els usuaris finals accedeixen NOMÉS a través de l'API
3. La base de dades NO és accessible directament pels usuaris
4. El propietari (administrador) pot:
   - Carregar noves versions via API d'administració
   - Exportar/Importar dades en format encriptat
   - Gestionar versions
5. Els paràmetres crítics estan protegits:
   - Factors d'emissió
   - Preus base
   - Propietats dels materials
   - Fórmules de càlcul
6. Encriptació:
   - AES-256 per a dades en repòs
   - TLS 1.3 per a dades en trànsit
   - Claus gestionades per AWS KMS / Azure Key Vault
"""
```

---

## 7. INTERFÍCIE D'USUARI (UI/UX)

### 7.1 Flux de Treball Principal

```
1. CREAR PROJECTE
   └── Dades del trànsit (IMD, %VP, TT, ZC)
   └── Georeferenciar obra (mapa interactiu)
   └── Definir vida útil i creixement

2. DEFINIR ESTRUCTURA
   └── Seleccionar tipologia (nova/reforç/reciclatge)
   └── Si és reforç: escanejar firme existent
   └── Definir restriccions (materials permesos, gruixos)

3. CONFIGURAR ORÍGENS DE MATERIALS
   └── Ubicar plantes d'asfalt (mapa)
   └── Ubicar pedreres i proveïdors
   └── Calcular distàncies automàticament

4. EXECUTAR CÀLCULS
   └── Generar combinacions de capes
   └── Verificar estructuralment
   └── Calcular emissions (A1-A5)
   └── Calcular costos

5. OPTIMITZAR
   └── Seleccionar criteri (estructural/emissions/econòmic/combinat)
   └── Configurar pesos (si és combinada)
   └── Executar algorisme d'optimització
   └── Visualitzar frontera de Pareto (opcional)

6. RESULTATS
   └── Comparar solucions
   └── Veure detall per etapa
   └── Exportar informes
   └── Generar certificats (si és fabricant)
```

### 7.2 Pantalles Principals

#### 7.2.1 Dashboard
- Resum de projectes actius
- Gràfics d'emissions totals
- Alertes de certificats propers a caducar
- Accés ràpid a projectes recents

#### 7.2.2 Editor de Projecte
- Formulari de dades del trànsit
- Mapa interactiu per georeferenciar
- Visualitzador d'estructures
- Taula comparativa de solucions

#### 7.2.3 Visualitzador d'Estructura
- Croquis del ferm (vista en secció)
- Detall de cada capa (material, gruix, propietats)
- Indicadors de viabilitat estructural
- Botó per veure càlculs detallats

#### 7.2.4 Calculadora d'Emissions
- Formulari per introduir dades A1-A5
- Desglossament en temps real
- Gràfics de contribució per etapa
- Comparativa amb límits normatius

#### 7.2.5 Generador de Certificats
- Selecció de mescla i obra
- Preview del certificat
- Generació de PDF
- Historial de certificats emesos

### 7.3 Internationalització (i18n)

```python
IDIOMES_SUPORTATS = ['ca', 'es', 'en', 'fr']

# Estructura de traduccions
TRADUCCIONS = {
    'ca': {
        'app.titol': 'Calculadora Optimitzadora de Ferms',
        'app.subtitol': 'Certificats Ambientals de Producte',
        'projecte.nou': 'Nou Projecte',
        'projecte.nom': 'Nom del Projecte',
        'emis.A1': 'Producció de materials',
        'emis.A2': 'Transport de materials',
        'emis.A3': 'Fabricació',
        'emis.A4': 'Transport de mescla',
        'emis.A5': 'Posada en obra',
        # ... més traduccions
    },
    'es': {
        'app.titol': 'Calculadora Optimizadora de Firmes',
        'app.subtitol': 'Certificados Ambientales de Producto',
        'projecte.nou': 'Nuevo Proyecto',
        'projecte.nom': 'Nombre del Proyecto',
        'emis.A1': 'Producción de materiales',
        'emis.A2': 'Transporte de materiales',
        'emis.A3': 'Fabricación',
        'emis.A4': 'Transporte de mezcla',
        'emis.A5': 'Puesta en obra',
        # ... més traduccions
    },
    'en': {
        'app.titol': 'Pavement Optimizer Calculator',
        'app.subtitol': 'Environmental Product Certificates',
        'projecte.nou': 'New Project',
        'projecte.nom': 'Project Name',
        'emis.A1': 'Material production',
        'emis.A2': 'Material transport',
        'emis.A3': 'Manufacturing',
        'emis.A4': 'Mix transport',
        'emis.A5': 'Placement',
        # ... més traduccions
    },
    'fr': {
        'app.titol': 'Calculateur Optimiseur de Chaussées',
        'app.subtitol': 'Certificats Environnementaux de Produit',
        'projecte.nou': 'Nouveau Projet',
        'projecte.nom': 'Nom du Projet',
        'emis.A1': 'Production de matériaux',
        'emis.A2': 'Transport de matériaux',
        'emis.A3': 'Fabrication',
        'emis.A4': 'Transport du mélange',
        'emis.A5': 'Mise en œuvre',
        # ... més traduccions
    },
}
```

---

## 8. INTEGRACIONS EXTERNES

### 8.1 GIS i Mapes

#### 8.1.1 Proveïdor de Mapes: OpenStreetMap + OpenRouteService
```python
# Configuració del servei GIS
GIS_CONFIG = {
    'proveidor': 'openstreetmap',
    'api_rutes': 'openrouteservice',
    'api_key': 'API_KEY',
    'cache_enabled': True,
    'cache_ttl': 86400,  # 24 hores
}

def calcular_ruta(origen, desti):
    """
    Calcula la ruta per carretera entre dos punts
    """
    client = openrouteservice.Client(key=GIS_CONFIG['api_key'])
    
    coords = ((origen.lon, origen.lat), (desti.lon, desti.lat))
    
    ruta = client.directions(
        coords,
        profile='driving-hgv',  # Camions pesats
        format='geojson',
        instructions=False
    )
    
    distancia_km = ruta['features'][0]['properties']['summary']['distance'] / 1000
    geometria = ruta['features'][0]['geometry']
    
    return {
        'distancia_km': distancia_km,
        'geometria': geometria,
        'durada_min': ruta['features'][0]['properties']['summary']['duration'] / 60
    }
```

#### 8.1.2 Visualització de Mapes: Leaflet / MapLibre
```javascript
// Component de mapa interactiu
function MapaProjecte({ projecte, ubicacions, onSeleccionar }) {
  return (
    <MapContainer center={projecte.ubicacio} zoom={12}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      {/* Marcador de l'obra */}
      <Marker position={projecte.ubicacio_obra}>
        <Popup>Obra: {projecte.denominacio}</Popup>
      </Marker>
      
      {/* Marcadors de plantes d'asfalt */}
      {ubicacions.filter(u => u.tipus === 'planta_asfalt').map(planta => (
        <Marker key={planta.id} position={planta.coordenades} icon={iconPlanta}>
          <Popup>Planta: {planta.nom}</Popup>
        </Marker>
      ))}
      
      {/* Rutes calculades */}
      {rutes.map(ruta => (
        <Polyline 
          key={ruta.id} 
          positions={ruta.geometria.coordinates}
          color={ruta.tipus === 'material' ? 'blue' : 'red'}
        />
      ))}
    </MapContainer>
  );
}
```

### 8.2 BIM (Building Information Modeling)

#### 8.2.1 Exportació a IFC
```python
def exportar_a_IFC(projecte, estructura):
    """
    Exporta l'estructura del ferm a format IFC
    """
    ifc_file = ifcopenshell.file()
    
    # Crear projecte IFC
    project = ifc_file.create_entity('IfcProject', GlobalId=generate_guid(), Name=projecte.nom)
    
    # Crear elements per cada capa
    for capa in estructura.capes:
        element = ifc_file.create_entity(
            'IfcBuildingElementProxy',
            GlobalId=generate_guid(),
            Name=f"{capa.tipus}_{capa.material.nom}",
            Description=f"Gruix: {capa.gruix_cm} cm",
            ObjectType='PavementLayer'
        )
        
        # Afegir propietats
        props = [
            ifc_file.create_entity('IfcPropertySingleValue', Name='Gruix', NominalValue=capa.gruix_cm),
            ifc_file.create_entity('IfcPropertySingleValue', Name='Material', NominalValue=capa.material.nom),
            ifc_file.create_entity('IfcPropertySingleValue', Name='ModulElastic', NominalValue=capa.modul_elastic_mpa),
        ]
        
        property_set = ifc_file.create_entity(
            'IfcPropertySet',
            GlobalId=generate_guid(),
            Name='PavementProperties',
            HasProperties=props
        )
        
        ifc_file.create_entity(
            'IfcRelDefinesByProperties',
            GlobalId=generate_guid(),
            RelatedObjects=[element],
            RelatingPropertyDefinition=property_set
        )
    
    return ifc_file
```

### 8.3 Importació de Bancs de Preus

#### 8.3.1 Format CSV (DGC, BEDEC, TCQ2000)
```python
def importar_banc_preus_csv(fitxer, font, versio):
    """
    Importa un banc de preus des d'un fitxer CSV
    """
    df = pandas.read_csv(fitxer, encoding='utf-8')
    
    nova_versio = crear_nova_versio_bd(font, versio)
    
    for _, row in df.iterrows():
        codi = row['CODIGO']
        descripcio = row['DESCRIPCION']
        unitat = row['UNIDAD']
        preu = float(row['PRECIO'])
        
        # Buscar o crear material
        material = buscar_o_crear_material(codi, descripcio, unitat)
        
        # Crear preu
        PreuMaterial.objects.create(
            material=material,
            font_preus=font,
            versio_font=versio,
            preu_eur_t=preu,
            versio_bd=nova_versio
        )
    
    return nova_versio
```

#### 8.3.2 Format Excel
```python
def importar_banc_preus_excel(fitxer, font, versio, full='PRECIOS'):
    """
    Importa un banc de preus des d'un fitxer Excel
    """
    df = pandas.read_excel(fitxer, sheet_name=full)
    
    # Mapeig de columnes segons el format
    if font == 'DGC':
        columnes = {
            'codi': 'CODIGO',
            'descripcio': 'DESCRIPCION',
            'unitat': 'UNIDAD',
            'preu': 'PRECIO_MEDIO',
        }
    elif font == 'BEDEC':
        columnes = {
            'codi': 'CODI',
            'descripcio': 'DESCRIPCIO',
            'unitat': 'UNITAT',
            'preu': 'PREU',
        }
    
    # Procés similar al CSV...
```

---

## 9. ANNEX DE CÀLCUL

### 9.1 Estructura de l'Annex

L'annex de càlcul generat per l'aplicació inclourà:

1. **Introducció**
   - Objectiu de l'estudi
   - Abast del càlcul
   - Referències normatives

2. **Dades del Projecte**
   - Característiques del trànsit
   - Propietats del fons
   - Estructura del ferm existent (si és reforç)

3. **Base de Dades Utilitzada**
   - Versió de la base de dades
   - Fonts dels factors d'emissió
   - Fonts dels preus

4. **Càlculs Detallats**
   - 4.1 Càlcul de la NEC
   - 4.2 Verificació estructural (per cada solució)
   - 4.3 Càlcul d'emissions A1-A5 (per cada solució)
   - 4.4 Càlcul de costos (per cada solució)

5. **Resultats**
   - Taules comparatives
   - Gràfics de contribució
   - Anàlisi de sensibilitat

6. **Conclusions**
   - Solució recomanada
   - Justificació de l'elecció

### 9.2 Format de l'Annex

L'annex es generarà en:
- **PDF**: Per a distribució i arxiu
- **Excel**: Per a anàlisi addicional per part de l'usuari
- **HTML**: Per a visualització web interactiva

---

## 10. PROMPTS INCREMENTALS PER CODEX

### 10.1 Estratègia de Desenvolupament

El desenvolupament es farà en **fases incrementals**:

1. **Fase 1**: Estructura base i autenticació
2. **Fase 2**: Gestió de projectes i dades mestres
3. **Fase 3**: Càlculs estructurals
4. **Fase 4**: Càlculs d'emissions
5. **Fase 5**: Optimització
6. **Fase 6**: Certificats PDF
7. **Fase 7**: GIS i integracions
8. **Fase 8**: Internacionalització
9. **Fase 9**: Testing i desplegament

---

**Document elaborat per l'Agent Swarm d'Enginyeria i Desenvolupament**
**Data: 2025-01-XX**
**Versió: 1.0**
