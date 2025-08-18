// API Types - Generated from Prisma schema

export type MemberStatus = 'active' | 'invited' | 'paused' | 'cancelled';
export type PriceType = 'fixed' | 'custom';
export type BillingCycle = 'monthly' | 'annual' | 'custom';
export type MembershipStatus = 'active' | 'trial' | 'paused' | 'cancelled' | 'expired';
export type BookingStatus = 'reserved' | 'checked_in' | 'no_show' | 'cancelled';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';
export type PaymentProvider = 'stripe' | 'mercadopago';
export type PaymentStatus = 'requires_action' | 'succeeded' | 'failed' | 'refunded';
export type PaymentMethodType = 'card' | 'bank_account' | 'wallet';

export interface Company {
  id: string;
  name: string;
  rfc: string;
  billingEmail: string;
  createdAt: string;
}

export interface Member {
  id: string;
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  status: MemberStatus;
  createdAt: string;
  company?: Company;
  memberships?: Membership[];
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  priceType: PriceType;
  priceMxnCents: number | null;
  billingCycle: BillingCycle;
  featuresJson: {
    features: string[];
    limits: Record<string, any>;
  } | null;
}



export interface Gym {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

export interface Visit {
  id: string;
  membershipId: string;
  gymId: string;
  checkIn: string;
  checkOut: string | null;
  membership?: Membership;
  gym?: Gym;
}

export interface Class {
  id: string;
  gymId: string;
  title: string;
  startsAt: string;
  capacity: number;
  gym?: Gym;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  classId: string;
  membershipId: string;
  status: BookingStatus;
  createdAt: string;
  class?: Class;
  membership?: Membership;
}

export interface Invoice {
  id: string;
  companyId: string;
  cfdiUuid: string | null;
  status: InvoiceStatus;
  totalMxnCents: number;
  issuedAt: string | null;
  company?: Company;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  provider: PaymentProvider;
  providerRef: string;
  status: PaymentStatus;
  paidMxnCents: number;
  createdAt: string;
  invoice?: Invoice;
}

export interface PaymentMethod {
  id: string;
  companyId: string;
  memberId: string | null;
  type: PaymentMethodType;
  brand: string | null;
  last4: string | null;
  stripePaymentMethodId: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string | null;
  member?: Member;
}

export interface BodyScanResult {
  scanId: string;
  bodyFatPercentage: number;
  muscleMass: number;
  bmi: number;
  recommendations: string[];
  poseQuality: 'excellent' | 'good' | 'fair' | 'poor';
  confidence: number;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface ChurnPrediction {
  memberId: string;
  churnRisk: 'low' | 'medium' | 'high';
  churnProbability: number;
  riskFactors: string[];
  recommendations: string[];
  nextPredictedAction: string;
}

export interface MemberInsights {
  member: {
    id: string;
    name: string;
    email: string;
    status: string;
  };
  churnPrediction: ChurnPrediction;
  engagement: {
    visitsThisMonth: number;
    daysSinceLastVisit: number | null;
    membershipDuration: number;
  };
  recommendations: string[];
  lastBodyScan: BodyScanResult | null;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  action: string;
  target: string;
  meta: Record<string, any> | null;
  createdAt: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface KPIOverview {
  activeMembers: number;
  gyms: number;
  wellnessProviders: number;
  avgActivationHours: number;
  monthlyRevenue: number | null;
  totalVisits: number;
  filteredVisits?: number;
  dateRange?: {
    from: string;
    to: string;
  };
  changes?: {
    activeMembers?: { delta: number; pct: number };
    monthlyRevenue?: { delta: number; pct: number };
    totalVisits?: { delta: number; pct: number };
    avgActivationHours?: { delta: number; pct: number };
  };
}

export interface DashboardSummary {
  activeVisits: number;
  capacityLimit: number;
  utilizationPercent: number;
  expiringCounts: {
    '7d': number;
    '14d': number;
    '30d': number;
  };
  revenue: {
    total: number;
    mrr: number;
    failedPayments: number;
    transactionCount: number;
  };
  classesToday: number;
  staffGaps: number;
  dateRange: {
    from: string;
    to: string;
    days: number;
  };
  locationId: string | null;
}

export interface RevenueAnalytics {
  range: string;
  data: Array<{
    date: string;
    revenue: number;
    transactions: number;
  }>;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgDailyRevenue: number;
  };
}

export interface PlansResponse {
  data: Plan[];
}

// Plan Types
export interface Plan {
  id: string;
  code: string;
  name: string;
  priceType: 'fixed' | 'custom';
  priceMXNFrom: number | null;
  billingCycle: 'monthly' | 'annual' | 'custom';
  features: string[];
  limits: {
    monthlyVisits: number; // -1 for unlimited
  };
}

export interface PlansResponse {
  plans: Plan[];
  total: number;
}

// Membership Types
export interface Membership {
  id: string;
  memberId: string | null;
  companyId: string;
  planId: string;
  status: 'draft' | 'active' | 'trial' | 'paused' | 'cancelled' | 'expired';
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  plan?: {
    id: string;
    name: string;
    code: string;
    priceMxnCents: number;
    featuresJson?: any;
  };
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

// API Request Types
export interface CreateCompanyRequest {
  name: string;
  rfc: string;
  billingEmail: string;
  timezone?: string;
  industry?: string;
}

export interface CreateMembershipRequest {
  planId: string;
  draft?: boolean;
  memberId?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  billingEmail?: string;
  timezone?: string;
  industry?: string;
}

export interface CreateMemberRequest {
  companyId: string;
  email: string;
  firstName: string;
  lastName: string;
  status?: MemberStatus;
}

export interface UpdateMemberRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  status?: MemberStatus;
}



// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

// Error Types
export interface APIError {
  message: string;
  errors?: Array<{
    code: string;
    message: string;
    path?: string[];
  }>;
}

export type APIResponse<T> = T | APIError;
