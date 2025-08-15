// Minimal types derived from api.openapi.upgraded.json
export type UUID = string;
export type ISODate = string;

export type MemberStatus = 'active' | 'inactive' | 'suspended' | 'cancelled';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'void' | 'overdue';
export type BookingStatus = 'booked' | 'cancelled' | 'attended' | 'no_show';
export type ScanMethod = 'mobile' | 'kiosk';
export type CheckInMethod = 'qr_code' | 'rfid' | 'manual' | 'app';

export interface Member {
  id: UUID;
  gymId: UUID;
  locationId?: UUID;
  email: string;
  fullName: string;
  phone?: string;
  birthdate?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  emergencyContact?: Record<string, unknown> | null;
  consentBiometric: boolean;
  consentMarketing: boolean;
  status: MemberStatus;
  joinedAt: ISODate;
  lastVisitAt?: ISODate;
  churnScore?: number | null;
  churnRisk?: 'low' | 'medium' | 'high';
  createdAt: ISODate;
  updatedAt: ISODate;
}




