'use client';

import { useEffect } from 'react';

const PATTERNS = /(PersistentStorage not yet initialized|Initializing 1Password|WASM is not initialized|message port closed)/i;

export function DevConsoleFilter() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development' || process.env.NEXT_PUBLIC_FILTER_EXTENSION_NOISE !== 'true') return;
    
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.error = (...args: any[]) => { 
      if (PATTERNS.test(String(args[0]))) return; 
      originalError(...args); 
    };
    
    console.warn = (...args: any[]) => { 
      if (PATTERNS.test(String(args[0]))) return; 
      originalWarn(...args); 
    };
    
    return () => { 
      console.error = originalError; 
      console.warn = originalWarn; 
    };
  }, []);
  
  return null;
}
