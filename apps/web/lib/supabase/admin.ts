import 'server-only';
// Supabase admin client disabled - using Railway API instead
// import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Mock Supabase admin client for compatibility
export const supabaseAdmin = {
  auth: {
    admin: {
      getUserById: () => Promise.resolve({ data: { user: null }, error: null }),
      createUser: () => Promise.resolve({ data: { user: null }, error: null }),
      updateUserById: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  },
  from: () => ({
    select: () => Promise.resolve({ data: [], error: null }),
    insert: () => Promise.resolve({ data: [], error: null }),
    update: () => Promise.resolve({ data: [], error: null }),
    delete: () => Promise.resolve({ data: [], error: null }),
  }),
};

export default supabaseAdmin;
