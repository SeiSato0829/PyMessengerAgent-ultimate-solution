/**
 * Supabaseダミークライアント
 * 本番環境でSupabase設定がない場合に使用
 */

class DummySupabaseClient {
  from(table: string) {
    return {
      select: () => this.createChain(),
      insert: () => this.createChain(),
      update: () => this.createChain(),
      delete: () => this.createChain(),
      upsert: () => this.createChain(),
    }
  }

  createChain() {
    const chain = {
      eq: () => chain,
      neq: () => chain,
      gt: () => chain,
      gte: () => chain,
      lt: () => chain,
      lte: () => chain,
      like: () => chain,
      ilike: () => chain,
      is: () => chain,
      in: () => chain,
      contains: () => chain,
      containedBy: () => chain,
      range: () => chain,
      overlaps: () => chain,
      match: () => chain,
      not: () => chain,
      or: () => chain,
      filter: () => chain,
      order: () => chain,
      limit: () => chain,
      single: () => Promise.resolve({ data: null, error: null }),
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
      then: (resolve: any) => {
        resolve({ 
          data: [], 
          error: null 
        })
      }
    }
    return chain
  }

  auth = {
    signInWithPassword: async () => ({ 
      data: { user: null, session: null }, 
      error: { message: 'Supabase未設定：ダミーモードで動作中' } 
    }),
    signUp: async () => ({ 
      data: { user: null, session: null }, 
      error: { message: 'Supabase未設定：ダミーモードで動作中' } 
    }),
    signOut: async () => ({ error: null }),
    getSession: async () => ({ 
      data: { session: null }, 
      error: null 
    }),
    getUser: async () => ({ 
      data: { user: null }, 
      error: null 
    }),
  }

  storage = {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      download: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
      list: async () => ({ data: [], error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    })
  }

  realtime = {
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    })
  }
}

export const dummySupabase = new DummySupabaseClient()