"use client";

import { useTracking } from '../../hooks/useTracking';

interface TrackingProviderProps {
  children: React.ReactNode;
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  // Initialize tracking on mount
  useTracking();
  
  return <>{children}</>;
}
