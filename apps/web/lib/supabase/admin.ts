import 'server-only';
// Supabase admin client disabled - using Railway API instead
// All Supabase functionality has been replaced with Railway API calls

// Mock Supabase admin client for compatibility with existing code
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
