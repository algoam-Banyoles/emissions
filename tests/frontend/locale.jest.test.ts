import '@/i18n/config';
import { formatCurrency, formatDate, formatDateTime, formatNumber, formatUnit } from '@/utils/locale';
import i18n from '@/i18n/config';

describe('locale utils', () => {
  it('formats numbers and currency using active locale', async () => {
    await i18n.changeLanguage('en');
    expect(formatNumber(1234.56, 2)).toBe('1,234.56');
    expect(formatNumber(1234.56)).toBe('1,234.56');
    expect(formatCurrency(1000, 'EUR')).toContain('1,000');
    expect(formatCurrency(1000)).toContain('1,000');
  });

  it('formats date and unit in catalan', async () => {
    await i18n.changeLanguage('ca');
    expect(formatDate('2026-01-01T00:00:00.000Z')).toMatch(/2026/);
    expect(formatDateTime('2026-01-01T13:15:00.000Z')).toMatch(/2026|26/);
    expect(formatUnit(10, 'kilometer').toLowerCase()).toContain('km');
  });
});
