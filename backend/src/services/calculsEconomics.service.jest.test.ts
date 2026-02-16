import { calculsEconomicsService } from './calculsEconomics.service';

describe('calculsEconomicsService (jest)', () => {
  it('calculates material and transport costs', () => {
    const material = calculsEconomicsService.calcularCostMaterial('MAT', 10, 50);
    const transport = calculsEconomicsService.calcularCostTransport('MAT', 20, 0.1, 2);

    expect(material).toBeGreaterThan(0);
    expect(transport).toBe(4);
  });

  it('calculates total structure cost summary', () => {
    const result = calculsEconomicsService.calcularCostTotal({
      estructura: {
        tipologia: 'REFORC',
        capes: [
          { tipus: 'RODAMENT', nom: 'CR', gruixCm: 5, modulElasticMpa: 5000, coeficientPoisson: 0.35 },
          { tipus: 'BASE', nom: 'CB', gruixCm: 12, modulElasticMpa: 4000, coeficientPoisson: 0.35 }
        ]
      },
      areaM2: 100,
      vidaUtilAnys: 20
    });

    expect(result.totalEurM2).toBeGreaterThan(0);
    expect(result.perCapa.length).toBe(2);
    expect(result.costAnyVidaUtilEurM2).toBeGreaterThan(0);
  });

  it('uses defaults, clamps negative distances, and applies per-layer overrides', () => {
    const result = calculsEconomicsService.calcularCostTotal({
      estructura: {
        tipologia: 'NOVA_CONSTRUCCIO',
        capes: [
          { tipus: 'RODAMENT', nom: 'CR', gruixCm: 5, modulElasticMpa: 5000, coeficientPoisson: 0.35 },
          { tipus: 'INTERMEDIA', nom: 'INT', gruixCm: 6, modulElasticMpa: 4800, coeficientPoisson: 0.35 }
        ]
      },
      distancies: {
        distanciaGeneralKm: -10,
        perTipusCapaKm: {
          RODAMENT: 30
        }
      },
      preus: {
        preuMaterialPerTipus: {
          INTERMEDIA: 100
        }
      }
    });

    expect(result.areaM2).toBe(1);
    expect(result.vidaUtilAnys).toBe(20);
    expect(result.perCapa[0]?.distanciaKm).toBe(30);
    expect(result.perCapa[1]?.distanciaKm).toBe(0);
    expect(result.perCapa[1]?.preuMaterialEurT).toBe(100);
  });

  it('applies fabrication fallback and thickness factor clamps in installation cost', () => {
    const fabrication = calculsEconomicsService.calcularCostFabricacio('AUTL', 10);
    expect(fabrication).toBe(180);

    const explicitFabrication = calculsEconomicsService.calcularCostFabricacio('AUTL', 10, 22);
    expect(explicitFabrication).toBe(220);

    const unknownTipologiaFabrication = calculsEconomicsService.calcularCostFabricacio('UNKNOWN' as never, 10);
    expect(unknownTipologiaFabrication).toBe(170);

    const minClamp = calculsEconomicsService.calcularCostPosadaEnObra(5, 100, 10);
    const maxClamp = calculsEconomicsService.calcularCostPosadaEnObra(100, 100, 10);
    expect(minClamp).toBe(600);
    expect(maxClamp).toBe(2500);
  });

  it('falls back to default material price when layer type is unknown', () => {
    const result = calculsEconomicsService.calcularCostTotal({
      estructura: {
        tipologia: 'REFORC',
        capes: [
          {
            tipus: 'UNKNOWN' as never,
            nom: 'X',
            gruixCm: 10,
            modulElasticMpa: 4000,
            coeficientPoisson: 0.35
          }
        ]
      }
    });

    expect(result.perCapa[0]?.preuMaterialEurT).toBe(50);
  });
});
