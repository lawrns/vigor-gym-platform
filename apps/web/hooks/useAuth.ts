"use client";

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: 'owner' | 'manager' | 'trainer' | 'staff' | 'member';
  firstName?: string;
  lastName?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Simulate auth check
    const checkAuth = async () => {
      try {
        // For now, return a mock user for development
        // In production, this would check with the API
        setState({
          user: {
            id: 'mock-user-id',
            email: 'admin@testgym.mx',
            role: 'owner',
            firstName: 'Admin',
            lastName: 'User',
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    };

    checkAuth();
  }, []);

  return state;
}
