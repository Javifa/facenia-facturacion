import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://zkxyvhrqxetxomrwbajm.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xSVzOuaHinUoEYCQVa00qg_1-nMzUx8';

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const supabaseUrl =
  rawUrl && rawUrl !== 'https://tu-proyecto.supabase.co'
    ? rawUrl
    : DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  rawKey && rawKey !== 'tu-anon-key' && rawKey !== 'tu-anon-key-aqui'
    ? rawKey
    : DEFAULT_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

