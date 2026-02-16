# APIs DE DADES OBERTES PER A UBICACIONS

## Llista d'APIs disponibles per georeferenciar plantes, pedreres i fàbriques

---

## 1. OPENSTREETMAP (OSM) - OVERPASS API

### Descripció
API gratuïta i oberta per obtenir dades geoespacials. Ideal per trobar pedreres, plantes industrials, etc.

### URL
```
https://overpass-api.de/api/interpreter
```

### Queries d'exemple

#### Pedreres a Catalunya
```
[out:json];
area["name"="Catalunya"]->.searchArea;
(
  node["industry"="quarry"](area.searchArea);
  way["industry"="quarry"](area.searchArea);
  relation["industry"="quarry"](area.searchArea);
);
out center;
```

#### Plantes d'asfalt a Espanya
```
[out:json];
area["name:es"="España"]->.searchArea;
(
  node["industrial"="asphalt_plant"](area.searchArea);
  way["industrial"="asphalt_plant"](area.searchArea);
);
out center;
```

#### Fàbriques de ciment/betum
```
[out:json];
area["name:es"="España"]->.searchArea;
(
  node["industrial"="cement_plant"](area.searchArea);
  way["industrial"="cement_plant"](area.searchArea);
);
out center;
```

### Documentació
https://wiki.openstreetmap.org/wiki/Overpass_API

### Avantatges
- ✅ Gratuïta
- ✅ Sense límit d'ús (raonable)
- ✅ Dades obertes
- ✅ Cobertura mundial

### Limitacions
- ❌ Dades potser incompletes
- ❌ Sense informació de contacte
- ❌ Sense capacitat de producció

---

## 2. ICGC (INSTITUT CARTOGRÀFIC I GEOLÒGIC DE CATALUNYA)

### Descripció
Dades oficials de Catalunya sobre pedreres, extraccions i recursos geològics.

### URLs
```
Web: https://www.icgc.cat/
WMS: https://geoserveis.icgc.cat/servei/catalunya/infoterreny/wms
```

### Serveis disponibles
- **Pedreres actives**: WMS layer "pedreres"
- **Recursos geològics**: WMS layer "recursos"
- **Cartografia geològica**: Diferents escales

### Accés
- Registre gratuït necessari per a alguns serveis
- API key per a ús intensiu

### Documentació
https://www.icgc.cat/ca/Geoinformacio-serveis-territori/Geoinformacio-serveis

### Avantatges
- ✅ Dades oficials i verificades
- ✅ Informació detallada de pedreres
- ✅ Actualitzades periòdicament

### Limitacions
- ❌ Només Catalunya
- ❌ Requereix registre
- ❌ Format WMS (requereix transformació)

---

## 3. MINISTERI DE TRANSICIÓ ECOLÒGICA (MITECO)

### Descripció
Registre de residus i plantes de tractament a Espanya.

### URL
```
https://www.miteco.gob.es/
```

### Dades disponibles
- Plantes de reciclatge d'àrids
- Plantes de tractament de residus de construcció
- Instal·lacions autoritzades

### Accés
- Web scraping limitat
- Descàrrega de llistats en PDF/Excel
- No té API REST oficial

### Alternativa
Descàrrega manual de dades i importació a la base de dades.

---

## 4. EUROSTAT - EUROPEAN COMMISSION

### Descripció
Dades estadístiques de la UE sobre indústria i extraccions.

### URL
```
https://ec.europa.eu/eurostat/
```

### Dades rellevants
- Producció d'àrids per país
- Indústria de materials de construcció
- Estadístiques d'extracció

### Accés
- API REST disponible
- Format JSON/XML

### Documentació
https://ec.europa.eu/eurostat/web/main/data/web-services

---

## 5. GEOCODING APIs (per adreces)

### 5.1 OpenCage Geocoder
```
URL: https://opencagedata.com/api
Preu: Gratuït (2.500 peticions/dia), plans de pagament
Documentació: https://opencagedata.com/api
```

### 5.2 PositionStack
```
URL: https://positionstack.com/
Preu: Gratuït (25.000 peticions/mes), plans de pagament
Documentació: https://positionstack.com/documentation
```

### 5.3 Geoapify
```
URL: https://www.geoapify.com/
Preu: Gratuït (3.000 crèdits/dia), plans de pagament
Documentació: https://www.geoapify.com/geocoding-api/
```

---

## 6. RUTES I DISTÀNCIES

### 6.1 OpenRouteService (ORS)
```
URL: https://api.openrouteservice.org/
Preu: Gratuït (2.000 peticions/dia), plans de pagament
Documentació: https://openrouteservice.org/dev/#/api-docs

Endpoints:
- /v2/directions/driving-car (cotxe)
- /v2/directions/driving-hgv (camions pesats)
```

### 6.2 OSRM (Open Source Routing Machine)
```
URL: http://router.project-osrm.org/
Preu: Gratuït (ús públic limitat)
Documentació: http://project-osrm.org/

Nota: Per ús intensiu, desplegar instància pròpia amb Docker.
```

---

## 7. IMPLEMENTACIÓ RECOMANADA

### Estratègia
1. **Primària**: OpenStreetMap (Overpass API) per pedreres i plantes
2. **Secundària**: ICGC per Catalunya (dades oficials)
3. **Geocodificació**: OpenCage o Geoapify per convertir adreces a coordenades
4. **Rutes**: OpenRouteService per calcular distàncies

### Exemple d'ús combinat
```javascript
// 1. Buscar pedreres a 50km de l'obra
const pedreresOSM = await buscarPedreresOSM(latObra, lngObra, 50000);

// 2. Enriquir amb dades de ICGC (si està a Catalunya)
const pedreresICGC = await buscarPedreresICGC(latObra, lngObra, 50000);

// 3. Combinar i eliminar duplicats
const pedreresUniques = combinarPedreres(pedreresOSM, pedreresICGC);

// 4. Per cada pedrera, calcular distància a l'obra
for (const pedrera of pedreresUniques) {
  const ruta = await calcularRutaORS(
    {lat: pedrera.lat, lng: pedrera.lng},
    {lat: latObra, lng: lngObra}
  );
  pedrera.distanciaKm = ruta.distancia;
  pedrera.duradaMin = ruta.durada;
}

// 5. Ordenar per distància
pedreresUniques.sort((a, b) => a.distanciaKm - b.distanciaKm);
```

---

## 8. LLISTAT DE TIPOLOGIES OSM PER CERCAR

### Pedreres
```javascript
const tagsPedreres = [
  { key: 'industry', value: 'quarry' },
  { key: 'landuse', value: 'quarry' },
  { key: 'resource', value: 'gravel' },
  { key: 'resource', value: 'sand' },
  { key: 'resource', value: 'stone' }
];
```

### Plantes d'asfalt
```javascript
const tagsPlantesAsfalt = [
  { key: 'industrial', value: 'asphalt_plant' },
  { key: 'man_made', value: 'works' },
  { key: 'product', value: 'asphalt' }
];
```

### Fàbriques de ciment/betum
```javascript
const tagsFabricasCiment = [
  { key: 'industrial', value: 'cement_plant' },
  { key: 'product', value: 'cement' }
];
```

---

## 9. CONSIDERACIONS LEGALS

### OpenStreetMap
- Dades sota llicència ODbL (Open Database License)
- Atribució obligatòria: "© OpenStreetMap contributors"
- Enllaç: https://www.openstreetmap.org/copyright

### ICGC
- Dades públiques amb atribució
- Consultar termes específics a https://www.icgc.cat/

### APIs de geocodificació
- Revisar termes de servei de cada proveïdor
- Generalment requereixen atribució

---

**Document per a implementació d'APIs**
**Data**: 2025-01-XX
