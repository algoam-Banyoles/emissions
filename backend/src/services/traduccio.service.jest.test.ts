import { traduccioService } from './traduccio.service';

describe('traduccioService (jest)', () => {
  const base = {
    projecteNom: 'Projecte',
    obraNom: 'Obra',
    fabricantNom: 'Fabricant',
    mesclaNom: 'MBC',
    tipologiaMescla: 'MBC_CONVENCIONAL',
    versioMetodologia: 'OC 3/2024',
    quantitatTones: 100,
    annexText: 'Text base',
    emissions: {
      A1: 1,
      A2: 1,
      A3: 1,
      A4: 1,
      A5: 1,
      total: 5,
      limit: 70,
      unitat: 'kg CO2e/t'
    }
  };

  it('translates certificate template to english', () => {
    const translated = traduccioService.traduirCertificat(base, 'en');
    expect(translated.plantilla.title).toContain('ENVIRONMENTAL PRODUCT CERTIFICATE');
  });

  it('translates annex text to french', () => {
    const annex = traduccioService.traduirAnnex('Annex original', 'fr');
    expect(annex).toContain('Annexe de calcul');
  });

  it('returns default annex prefix when annex text is empty', () => {
    const annex = traduccioService.traduirAnnex('   ', 'ca');
    expect(annex).toBe('Annex de calcul.');
  });

  it('defaults annex to empty when omitted in certificate payload', () => {
    const { annexText, ...withoutAnnex } = base;
    const translated = traduccioService.traduirCertificat(withoutAnnex, 'es');
    expect(translated.dades.annexText).toBe('Anexo de calculo.');
  });
});
