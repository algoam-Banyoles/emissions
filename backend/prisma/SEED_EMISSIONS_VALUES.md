# Dades Seed Emissions 2024.1

Aquest document descriu els valors inserits per `prisma/seed-emissions.ts`.

## Cobertura

- Factors oficials: **56**
- Limits normatius: **4**
- Total registres inserits: **60**

## Desglossament per etapes

- A1 materials: 26 (codis `10a..19d`)
- A2/A4 transport: 3 (codis `20/40`, `21`, `22`)
- A3 constants calorifiques: 6
- A3 combustibles: 3 (codis `31`, `32`, `33`)
- A3 consum electric: 3 (codis `34a`, `34b`, `34c`)
- A3 pala carregadora: 1 (codi `30`)
- A5 equips posada en obra: 14 (codis `50..59c`, inclou `54b` compactador 21t)
- Limits normatius OC 3/2024: 4

## Fonts i observacions

- Fonts principals: DAP FdA, DAP REPSOL, DAP CIRTEC, DAP IECA, EULA, SEVE, MITERD, EPA.
- Credits negatius (A1):
  - `16a` RARx CaCO3 = `-141.0`
  - `16b` RARx Ca(OH)2 = `-59.6`
  - `16c` RARx Tyrexol = `-1060.3`
- Valor pendent:
  - `18` PVC filler = `0.0` (provisional, pendent de font oficial).

## Idempotencia

El seed es idempotent:

1. Fa `upsert` de `VersioBaseDades` (`2024.1`).
2. Desactiva altres versions actives.
3. Esborra registres previs d'emissions per aquesta versio.
4. Reinserta dades validades i comprova comptatges finals.

## Validacions incloses al seed

- Comprovacio de presència de codis obligatoris A1.
- Verificacio de comptatges exactes per etapa.
- Validacio numerica (`Number.isFinite`) de factors i capacitats.
- Validacio de fonts (`font` no buida).
- Validacio final contra BD (56 factors + 4 limits).
