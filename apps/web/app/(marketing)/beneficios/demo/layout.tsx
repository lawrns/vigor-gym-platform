import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Prueba GoGym en 60 segundos',
  description:
    'Experimenta cómo funciona GoGym sin registrarte. Demo interactivo de check-in, reservas y progreso.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
