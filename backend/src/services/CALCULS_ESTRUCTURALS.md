# Motor de Calcul Estructural (6.1 IC simplificat)

Aquest document resumeix les formules implementades a `src/services/calculsEstructurals.service.ts`.

## 1) Calcul de NEC

Formula:

`NEC = 365 * IMD * (%VP / 100) * FD * FE * FC`

On:
- `IMD`: intensitat mitjana diaria.
- `%VP`: percentatge de vehicles pesants.
- `FD`: factor de distribucio.
- `FE`: factor d'equivalencia.
- `FC`: factor de creixement acumulat.

`FC`:
- Si `g > 0`: `FC = ((1 + g)^n - 1) / g`
- Si `g = 0`: `FC = n`

On:
- `g = creixementAnualPercent / 100`
- `n = anysProjecte`

## 2) Verificacio estructural multicapa simplificada (tipus BISAR)

El model calcula:
- Modul equivalent de capes.
- Deformacio de traccio (zona bituminosa).
- Deformacio de compressio (fons).
- Cicles admissibles per fatiga i aixecament.

### 2.1 Tensio de contacte

`sigma = P / (pi * a^2)`

On:
- `P = 50 kN` (carrega de roda simplificada)
- `a = 0.15 m` (radi de contacte simplificat)

### 2.2 Deformacions

- `epsilon_t = (sigma / E_asfalt) * exp(-z / (a + 0.04))`
- `epsilon_c = (sigma / E_fons) * (1 / (1 + 4z))`

Les deformacions es reporten en microdeformacio:
- `epsilon_micro = epsilon * 1e6`

### 2.3 Criteris de fatiga i aixecament

- `N_fatiga = 1.2e12 * (1 / epsilon_t_micro)^3.8 * (1 / E_eq)^0.2`
- `N_aixecament = 2.0e19 * (1 / epsilon_c_micro)^4.2`

Ratios de comprovacio:
- `R_fatiga = NEC / N_fatiga`
- `R_aixecament = NEC / N_aixecament`

### 2.4 Deformacio superficial

`deformacio_mm = (epsilon_c_micro / 1e6) * z * 1000 * 2.5`

## 3) Criteri de viabilitat

Una estructura es considera viable si:
- `R_fatiga <= 1`
- `R_aixecament <= 1`
- `deformacio_mm <= 25`

## 4) Generacio de combinacions de capes

L'algoritme genera totes les combinacions possibles de gruix per capa,
respectant:
- gruix minim/maxim
- pas (normalment 0.5 cm)
- limit maxim de combinacions

Sortida:
- `CapaFirme[][]` amb totes les configuracions candidates.
