# Estructura Base de Dades d'Emissions (OC 3/2024)

## Visio general

Aquesta estructura amplia `prisma/schema.prisma` amb models per les etapes A1-A5 i la seva traçabilitat per versio.

## Models principals

- `FactorEmissioMaterial` (A1): factors per material, categoria, font i incertea.
- `FactorEmissioTransport` (A2/A4): factors per tipus de vehicle i combustible.
- `ConstantCalorifica` (A3): constants termiques per materials.
- `CombustibleFabricacio` (A3): PCI i factor d'emissio per combustible.
- `ConsumElectric` (A3): consum i factors de xarxa/grup.
- `EquipPosadaEnObra` (A5): equips i rendiments d'execucio.
- `LimitNormatiuEmissions`: limits normatius per tipologia i etapa.
- `EmissionsChangeLog`: historial de canvis i traçabilitat.

## Relacions

- Tots els models d'emissions tenen `versioBaseDadesId` obligatori.
- `VersioBaseDades` te col·leccions de tots els factors i limits.
- `EmissionsChangeLog` apunta a `VersioBaseDades` i opcionalment a `Usuari`.

## Indexos clau

- `FactorEmissioMaterial`: `@@unique([codiMaterial, versioBaseDadesId])`, `@@index([categoria, actiu])`.
- `FactorEmissioTransport`: `@@index([tipusVehicle, actiu])`.
- Indexos addicionals per `versioBaseDadesId + actiu` a tots els models per consultes de versio activa.

## Validacions de dades (migration SQL)

S'han afegit `CHECK` constraints a la migracio `20260215232000_emissions_models`:

- Factors no negatius en general.
- Excepcio de credits en A1: `factorEmissio >= 0 OR esCredit = true`.
- Capacitats i PCI positius.
- Anys de referencia en rang `1900..2100`.
- Coherencia d'unitats per transport (`T_KM`) i equips (`H`).

## Seed basic

El fitxer `prisma/seed.ts` crea/actualitza la versio `2024.1` i inserta registres minims per:

- A1 (`FactorEmissioMaterial`)
- A2/A4 (`FactorEmissioTransport`)
- A3 (`ConstantCalorifica`, `CombustibleFabricacio`, `ConsumElectric`)
- A5 (`EquipPosadaEnObra`)
- Limits (`LimitNormatiuEmissions`)
- Traçabilitat (`EmissionsChangeLog`)

## Comandes

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:deploy
npm run seed:emissions
```

Nota: `prisma migrate` i `seed` requereixen `DATABASE_URL` configurada.
