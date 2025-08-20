import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../components/ui/FeatureCard';

describe('FeatureCard', () => {
  it('renders title and description', () => {
    render(<FeatureCard iconName="Dumbbell" title="Training" desc="Más de 4,500 espacios" />);
    expect(screen.getByText('Training')).toBeInTheDocument();
    expect(screen.getByText(/4,500/)).toBeInTheDocument();
  });
});

