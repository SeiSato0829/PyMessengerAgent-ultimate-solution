import { Pool } from 'pg';

// Render PostgreSQL用の接続設定
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export { pool };

// Supabase互換のクライアント作成
export const createSupabaseCompatibleClient = () => {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async (credentials: any) => ({ 
        data: { user: null, session: null }, 
        error: null 
      }),
      signUp: async (credentials: any) => ({ 
        data: { user: null, session: null }, 
        error: null 
      }),
    },
    from: (tableName: string) => ({
      select: (columns?: string) => ({
        eq: (column: string, value: any) => ({
          single: () => ({ data: null, error: null }),
        }),
        order: (column: string, options?: any) => ({
          limit: (count: number) => ({ data: [], error: null }),
        }),
        limit: (count: number) => ({ data: [], error: null }),
        execute: () => ({ data: [], error: null }),
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => ({ data: null, error: null }),
        }),
        execute: () => ({ data: null, error: null }),
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          execute: () => ({ data: null, error: null }),
        }),
      }),
    }),
    channel: (channelName: string) => ({
      on: (event: string, options: any, callback: Function) => ({
        subscribe: () => ({}),
      }),
    }),
    removeChannel: (subscription: any) => {},
  };
};