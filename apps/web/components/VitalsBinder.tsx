'use client';

import { useEffect } from 'react';
import { bindWebVitals } from '../lib/metrics/vitals';

export function VitalsBinder() {
  useEffect(() => {
    bindWebVitals();
  }, []);
  return null;
}


