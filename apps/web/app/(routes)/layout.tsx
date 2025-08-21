import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | GoGym',
    default: 'GoGym',
  },
  description: 'GoGym - Plataforma de gestión de gimnasios para México',
};

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
