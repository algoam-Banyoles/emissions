import '@/i18n/config';
import { fireEvent, render, screen } from '@testing-library/react';

import { SelectorIdioma } from '@/components/layout/SelectorIdioma';

describe('SelectorIdioma', () => {
  it('changes selected language', () => {
    render(<SelectorIdioma />);

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'fr' } });

    expect((select as HTMLSelectElement).value).toBe('fr');
  });
});
