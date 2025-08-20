import { render, screen } from '@testing-library/react';
import { PlanCard } from '../components/ui/PlanCard';

describe('PlanCard', () => {
  it('renders name, price and features', () => {
    render(
      <PlanCard
        name="TP PRO"
        price="$$"
        features={['Beneficios', 'Control', 'Reportes']}
        cta={{ label: 'Elegir PRO', href: '/registro' }}
      />
    );
    expect(screen.getByText('TP PRO')).toBeInTheDocument();
    expect(screen.getByText('$$')).toBeInTheDocument();
    expect(screen.getByText('Beneficios')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Elegir PRO' })).toHaveAttribute('href', '/registro');
  });
});

