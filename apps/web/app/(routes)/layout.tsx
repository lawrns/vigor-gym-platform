import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Vigor',
    default: 'Vigor',
  },
  description: 'Vigor Gym Management Platform',
};

export default function RoutesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
