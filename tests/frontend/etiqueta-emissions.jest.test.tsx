import { render, screen } from '@testing-library/react';

import { EtiquetaEmissions } from '@/components/forms/EtiquetaEmissions';

describe('EtiquetaEmissions', () => {
  it('renders fallback when no value provided', () => {
    render(<EtiquetaEmissions />);

    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders emission value and level badge', () => {
    render(<EtiquetaEmissions nivell="BAIX" valorKgT={12.3456} />);

    expect(screen.getByText('BAIX')).toBeInTheDocument();
    expect(screen.getByText('12.35 kg/t')).toBeInTheDocument();
  });

  it('renders medium and high level labels', () => {
    const { rerender } = render(<EtiquetaEmissions nivell="MITJA" />);
    expect(screen.getByText('MITJA')).toBeInTheDocument();

    rerender(<EtiquetaEmissions nivell="ALT" />);
    expect(screen.getByText('ALT')).toBeInTheDocument();
  });
});
