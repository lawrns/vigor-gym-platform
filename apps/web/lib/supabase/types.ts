/**
 * Supabase Database Types
 * Generated from Supabase schema
 */

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_companies: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          role: string;
          permissions: string[] | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          role: string;
          permissions?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          role?: string;
          permissions?: string[] | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      visits: {
        Row: {
          id: string;
          member_id: string;
          gym_id: string;
          checked_in_at: string;
          checked_out_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          gym_id: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          gym_id?: string;
          checked_in_at?: string;
          checked_out_at?: string | null;
          created_at?: string;
        };
      };
      memberships: {
        Row: {
          id: string;
          member_id: string;
          plan_id: string;
          status: string;
          starts_at: string;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          member_id: string;
          plan_id: string;
          status: string;
          starts_at: string;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          member_id?: string;
          plan_id?: string;
          status?: string;
          starts_at?: string;
          expires_at?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          membership_id: string;
          amount: number;
          currency: string;
          status: string;
          processed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          membership_id: string;
          amount: number;
          currency: string;
          status: string;
          processed_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          membership_id?: string;
          amount?: number;
          currency?: string;
          status?: string;
          processed_at?: string;
          created_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          title: string;
          instructor_name: string;
          starts_at: string;
          capacity: number;
          gym_id: string;
          gym_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          instructor_name: string;
          starts_at: string;
          capacity: number;
          gym_id: string;
          gym_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          instructor_name?: string;
          starts_at?: string;
          capacity?: number;
          gym_id?: string;
          gym_name?: string;
          created_at?: string;
        };
      };
      class_bookings: {
        Row: {
          id: string;
          class_id: string;
          member_id: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          member_id: string;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          member_id?: string;
          status?: string;
          created_at?: string;
        };
      };
      staff_shifts: {
        Row: {
          id: string;
          staff_id: string;
          gym_id: string;
          position: string;
          starts_at: string;
          ends_at: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          gym_id: string;
          position: string;
          starts_at: string;
          ends_at: string;
          status: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          gym_id?: string;
          position?: string;
          starts_at?: string;
          ends_at?: string;
          status?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
