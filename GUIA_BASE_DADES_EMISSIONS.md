# GUIA: BASE DE DADES D'EMISSIONS

## Introducció

La base de dades d'emissions és el **nucli fonamental** de l'aplicació per al càlcul de la petjada de carboni. Conté tots els factors d'emissió, constants i paràmetres necessaris per calcular les emissions segons l'Ordre Circular 3/2024.

---

## Estructura de la Base de Dades

### 1. FactorEmissioMaterial (Etapa A1 - Producció)

Conté els factors d'emissió per a la producció de tots els materials.

**Camps:**
- `id`: UUID
- `codi_material`: Codi únic (ex: "betun_convencional")
- `nom`: Nom descriptiu
- `categoria`: Categoria (arids, betums, emulsions, additius, etc.)
- `factor_emissio`: Valor numèric (kg CO2e/unitat)
- `unitat`: Unitat de mesura (kg, t, m3, l)
- `font_dades`: Font oficial (DAP REPSOL, DAP FdA, SEVE, etc.)
- `any_referencia`: Any de les dades
- `versio_dap`: Versió de la DAP
- `incertesa_percentatge`: Marge d'incertesa
- `actiu`: Boolean
- `versio_bd_id`: Relació amb versió de base de dades

**Exemples de dades:**
```
betun_convencional: 272.0 kg CO2e/t (DAP REPSOL 2020)
arido_natural: 4.48 kg CO2e/t (DAP FdA AN 2022)
RARx_caco3: -141.0 kg CO2e/t (DAP CIRTEC 2024) [CRÈDIT!]
```

---

### 2. FactorEmissioTransport (Etapes A2/A4 - Transport)

Factors d'emissió per als diferents tipus de vehicles de transport.

**Camps:**
- `id`: UUID
- `tipus_vehicle`: Identificador (ex: "camion_semirremolque_28t")
- `descripcio`: Descripció del vehicle
- `capacitat_tonelades`: Càrrega útil màxima
- `factor_emissio`: kg CO2e per tona-kilòmetre
- `combustible`: Tipus de combustible utilitzat
- `font_dades`: Font (SEVE V4.0)
- `any_referencia`: Any de les dades
- `actiu`: Boolean

**Dades inicials:**
```
camion_semirremolque_28t: 0.0849 kg CO2e/t·km
camion_rigido_9t: 0.17 kg CO2e/t·km
camion_cisterna_24t: 0.0881 kg CO2e/t·km
```

---

### 3. ConstantCalorifica (Etapa A3 - Fabricació)

Constants calorífiques per al càlcul de la demanda energètica.

**Camps:**
- `id`: UUID
- `nom_material`: Nom del material
- `calor_especific`: kJ/kg·K
- `temperatura_referencia`: Temperatura de referència (°C)
- `font_dades`: Font
- `actiu`: Boolean

**Dades inicials:**
```
aridos_naturales: 0.835 kJ/kg·K
arido_siderurgico: 0.78 kJ/kg·K
betun: 2.093 kJ/kg·K
RA: 0.89161 kJ/kg·K
aigua: 4.184 kJ/kg·K
calor_vaporitzacio: 2.25 MJ/kg
```

---

### 4. CombustibleFabricacio (Etapa A3 - Fabricació)

Dades dels combustibles utilitzats a la planta d'asfalt.

**Camps:**
- `id`: UUID
- `nom_combustible`: gasoleo, fueloleo, gas_natural
- `poder_calorific_inferior`: PCI (MJ/kg o MJ/GJ)
- `factor_emissio`: kg CO2e per unitat d'energia
- `unitat_fe`: unitat del factor d'emissió (kg/GJ, kg/kg)
- `font_dades`: Font (SEVE, MITERD)
- `any_referencia`: Any
- `actiu`: Boolean

**Dades inicials:**
```
gasoleo: PCI=43.0 MJ/kg, FE=3.17 kg CO2e/kg
fueloleo: PCI=40.4 MJ/kg, FE=93.2 kg CO2e/GJ
gas_natural: PCI=48.31 MJ/kg, FE=70.19 kg CO2e/GJ
```

---

### 5. ConsumElectric (Etapa A3 - Fabricació)

Consums elèctrics de la planta d'asfalt.

**Camps:**
- `id`: UUID
- `tipus_consum`: motors_central, calentament_ligants
- `consum_kwh_per_tona`: kWh per tona de mescla
- `factor_emissio_red`: kg CO2e/kWh (mix elèctric)
- `factor_emissio_grupo`: kg CO2e/kWh (grup electrògen)
- `factor_emissio_caldera`: kg CO2e/kWh (caldera)
- `font_dades`: Font (MITERD 2024, EPA 2010)
- `any_referencia`: Any
- `actiu`: Boolean

**Dades inicials:**
```
motors_central: 1.5 kWh/t, FE_red=0.283 kg CO2e/kWh
calentament_ligants: 0.5 kWh/t, FE_caldera=0.94466 kg CO2e/kWh
```

---

### 6. EquipPosadaEnObra (Etapa A5 - Puesta en Obra)

Factors d'emissió per als equips de construcció.

**Camps:**
- `id`: UUID
- `nom_equip`: Identificador (ex: "extendedora")
- `descripcio`: Nom descriptiu
- `tipus`: categoria d'equip
- `factor_emissio`: kg CO2e per hora de funcionament
- `rendiment_hores_per_tona`: h/t (configurable per l'usuari)
- `font_dades`: Font (SEVE Eco-comparateur 4.0, OC 4/2023)
- `any_referencia`: Any
- `actiu`: Boolean

**Dades inicials:**
```
silo_transferencia: 147.8 kg CO2e/h, 0.008 h/t
extendedora: 117.085 kg CO2e/h, 0.008 h/t
compactador_tandem_11t: 34.0 kg CO2e/h, 0.008 h/t
compactador_neumaticos_21t: 55.82 kg CO2e/h, 0.008 h/t
fresadora_1m: 124.35714 kg CO2e/h, 0.001 h/t
minibarredora: 25.043 kg CO2e/h, 0.004 h/t
```

---

### 7. LimitNormatiuEmissions

Límits d'emissions establerts per la normativa.

**Camps:**
- `id`: UUID
- `tipologia_mescla`: MBC_convencional, MBC_amb_RA, MBT, AUTL
- `etapa`: A1_A5, A1, A3, etc.
- `valor_limit`: kg CO2e/t
- `font_normativa`: OC 3/2024
- `data_entrada_vigor`: Data
- `actiu`: Boolean

**Dades inicials:**
```
MBC_convencional (A1_A5): 70.0 kg CO2e/t
MBC_amb_RA (A1_A5): 60.0 kg CO2e/t
MBT (A1_A5): 55.0 kg CO2e/t
AUTL (A1_A5): 45.0 kg CO2e/t
```

---

## Procés d'Alimentació de la Base de Dades

### 1. Inicialització (Seed)

```bash
# Executar el seed inicial
npm run seed:emissions
```

Això crea:
- Versió base de dades "2024.1"
- Tots els factors d'emissió oficials de l'OC 3/2024
- Constants calorífiques
- Combustibles
- Equips de puesta en obra
- Límits normatius

### 2. Actualització via CSV/Excel

**Format CSV per a materials (A1):**
```csv
CODI;NOM;CATEGORIA;FACTOR_EMISSIO;UNITAT;FONT_DADES;ANY_REFERENCIA
betun_convencional;Betum convencional 50/70;betums;272.0;t;DAP REPSOL;2020
arido_natural;Àrido natural;arids;4.48;t;DAP FdA AN;2022
```

**Format CSV per a transport (A2/A4):**
```csv
TIPUS_VEHICLE;DESCRIPCIO;CAPACITAT_T;FACTOR_EMISSIO;COMBUSTIBLE;FONT_DADES
camion_semirremolque_28t;Camió semiremolque 28t;28;0.0849;gasoleo;SEVE V4.0
```

### 3. Gestió via Interfície Web

L'administrador pot:
- Veure tots els factors d'emissió
- Editar valors (crea nova versió automàticament)
- Afegir nous materials
- Desactivar factors obsolets
- Veure historial de canvis

---

## Validacions Automàtiques

### Regles de Validació

1. **Completesa:**
   - Tots els materials bàsics han de tenir factor A1
   - Tots els tipus de vehicle han de tenir factor A2/A4
   - Tots els combustibles han de tenir PCI i FE

2. **Coherència:**
   - Factors d'emissió > 0 (excepte crèdits explícits)
   - Unitats consistents
   - Fonts de dades vàlides

3. **Temporal:**
   - Any de referència <= any actual
   - Factors actualitzats en els últims 3 anys (warning)

4. **Cobertura:**
   - Percentatge de materials amb factor d'emissió > 95%

### Alertes

El sistema envia alertes si:
- Hi ha factors amb valors sospitosos
- Fonts de dades obsoletes (>3 anys)
- Materials importants sense factor d'emissió
- Errors de consistència detectats

---

## Seguretat i Control d'Accés

### Nivells d'Accés

1. **Administrador d'Emissions** (rol: admin_emissions):
   - Pot modificar qualsevol factor d'emissió
   - Pot importar/exportar dades
   - Pot crear noves versions
   - Veure logs d'auditoria

2. **Administrador General** (rol: admin):
   - Mateixos permisos que admin_emissions
   - Pot assignar rols

3. **Usuari Normal** (rol: projectista, fabricant):
   - Només lectura dels factors d'emissió
   - No pot veure dades d'altres organitzacions

### Logs d'Auditoria

Cada canvi registra:
- Usuari que va realitzar el canvi
- Data i hora
- Factor modificat
- Valor anterior
- Valor nou
- Raó del canvi (opcional)

---

## Versions de la Base de Dades

### Sistema de Versions

- Cada conjunt de factors d'emissió pertany a una **VersioBaseDades**
- La versió activa és la que s'utilitza per als càlculs nous
- Les versions anteriors es mantenen per traçabilitat
- Els projectes antics mantenen la versió amb la qual es van calcular

### Procés d'Actualització

1. L'admin carrega nous factors via CSV/Excel
2. El sistema crea una nova VersioBaseDades
3. Tots els factors importats pertanyen a aquesta versió
4. L'admin pot activar la nova versió quan estigui llista
5. Els projectes nous utilitzaran la versió activa

---

## Consultes Comuns

### Obtenir factor d'emissió d'un material

```sql
SELECT factor_emissio, unitat, font_dades
FROM FactorEmissioMaterial
WHERE codi_material = 'betun_convencional'
AND actiu = true
AND versio_bd_id = (SELECT id FROM VersioBaseDades WHERE es_actual = true);
```

### Llistar tots els factors d'una categoria

```sql
SELECT codi_material, nom, factor_emissio
FROM FactorEmissioMaterial
WHERE categoria = 'betums'
AND actiu = true
ORDER BY nom;
```

### Verificar cobertura de materials

```sql
SELECT 
  COUNT(*) as total_materials,
  SUM(CASE WHEN fem.id IS NOT NULL THEN 1 ELSE 0 END) as amb_factor,
  (SUM(CASE WHEN fem.id IS NOT NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as percentatge_cobertura
FROM Material m
LEFT JOIN FactorEmissioMaterial fem ON m.codi = fem.codi_material 
  AND fem.actiu = true 
  AND fem.versio_bd_id = (SELECT id FROM VersioBaseDades WHERE es_actual = true);
```

---

## Integració amb el Càlcul d'Emissions

### Flux de Càlcul

1. L'usuari selecciona materials per a la mescla
2. El sistema busca els factors d'emissió A1 corresponents
3. Es calculen les distàncies de transport (A2)
4. Es calcula la demanda energètica de fabricació (A3)
5. Es calcula el transport de la mescla (A4)
6. Es calculen les emissions dels equips de puesta en obra (A5)
7. Es sumen totes les etapes per obtenir el total

### Exemple de Càlcul A1

```javascript
// Composició de la mescla
const composicio = [
  { material: 'betun_convencional', percentatge: 5.5 },  // %
  { material: 'arido_natural', percentatge: 92.0 },
  { material: 'polvo_caco3', percentatge: 2.5 },
];

// Càlcul A1
let E_A1 = 0;
for (const comp of composicio) {
  const factor = await getFactorEmissio(comp.material);  // kg CO2e/t
  const massa = comp.percentatge / 100;  // t per t de mescla
  E_A1 += massa * factor;
}
// Resultat: E_A1 en kg CO2e per tona de mescla
```

---

## Bones Pràctiques

### Per a Administradors

1. **Validar sempre** els fitxers CSV abans d'importar
2. **Fer preview** de les dades abans de confirmar
3. **Documentar** els canvis importants
4. **Mantenir** fonts de dades actualitzades
5. **Revisar** alertes de qualitat de dades

### Per a Desenvolupadors

1. **Cachejar** factors d'emissió per a consultes freqüents
2. **Validar** que existeix el factor abans de calcular
3. **Gestionar** errors si falta algun factor
4. **Registrar** quina versió de BD s'utilitza per a cada càlcul
5. **Optimitzar** consultes amb índexos adequats

---

## Resolució de Problemes

### Problema: Falta factor d'emissió per a un material

**Solució:**
1. Buscar font oficial (DAP del fabricant)
2. Afegir manualment via interfície web
3. O bé utilitzar factor d'emissió d'un material similar
4. Documentar la suposició

### Problema: Factor d'emissió obsolet

**Solució:**
1. Buscar nova DAP del fabricant
2. Actualitzar el factor (crea nova versió automàticament)
3. Revisar projectes que utilitzaven el factor antic

### Problema: Inconsistència en les dades

**Solució:**
1. Executar validació manual
2. Revisar logs d'auditoria
3. Corregir errors detectats
4. Tornar a validar

---

## Contacte i Suport

Per a dubtes sobre factors d'emissió:
- Consultar documentació oficial de l'OC 3/2024
- Contactar amb el fabricant del material per a la DAP
- Revisar bases de dades públiques (SEVE, MITERD)

---

**Document versió 1.0**
**Data: 2025-01-XX**
