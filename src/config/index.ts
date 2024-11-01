interface DatabaseConfig {
  supabase: {
    url: string;
    key: string;
    database: string;
    schema: string;
  };
}

interface Config {
  env: 'development' | 'production';
  database: DatabaseConfig;
}

export const config: Config = {
  env: import.meta.env.MODE || 'development',
  database: {
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_KEY || '',
      database: 'postgres',
      schema: 'public'
    }
  }
} as const;