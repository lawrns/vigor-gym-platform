/**
 * Shared domain types for the Vigor Gym Platform
 * These types provide type safety across web and API components
 */

// Base entity types
export interface BaseEntity {
  id: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Member types
export interface Member extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: Date | string;
  emergencyContact?: string;
  emergencyPhone?: string;
  companyId: string;
  status: 'active' | 'inactive' | 'suspended';
}

// Staff types
export interface Staff extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'admin' | 'manager' | 'trainer' | 'receptionist';
  companyId: string;
  isActive: boolean;
}

// Visit types
export interface Visit extends BaseEntity {
  memberId: string;
  companyId: string;
  checkInTime: Date | string;
  checkOutTime?: Date | string;
  visitType: 'checkin' | 'class' | 'personal_training';
  notes?: string;
}

// Plan types
export interface Plan extends BaseEntity {
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  duration: number; // in days
  companyId: string;
  isActive: boolean;
}

// Revenue/Analytics types
export interface RevenuePoint {
  date: string;
  amount: number;
  currency: string;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  currency: string;
  period: {
    start: Date | string;
    end: Date | string;
  };
  dataPoints: RevenuePoint[];
  growth?: {
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
}

// API Response types
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// Event types for SSE/WebSocket
export interface DashboardEvent {
  type: 'visit' | 'member_update' | 'revenue_update' | 'system';
  data: Record<string, unknown>;
  timestamp: Date | string;
  companyId: string;
}

// Form/Input types
export interface FormField {
  name: string;
  value: unknown;
  error?: string;
  required?: boolean;
}

export interface FormState {
  fields: Record<string, FormField>;
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Common props for React components
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
