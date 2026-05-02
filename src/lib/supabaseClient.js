/**
 * Supabase browser client for Maye Clinic (Vite).
 *
 * Setup:
 * 1. Copy `.env.example` to `.env` in the project root.
 * 2. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project
 *    (Settings → API in the Supabase dashboard).
 * 3. Restart `npm run dev` after changing `.env` (Vite reads env at startup).
 *
 * Usage elsewhere in the app:
 *   import { supabase, testSupabaseConnection } from './lib/supabaseClient.js'
 *   const { data, error } = await supabase.from('some_table').select('*')
 *
 * This file only creates the client — pages still use localStorage until you migrate them.
 */

import { createClient } from "@supabase/supabase-js";

/** @type {string | undefined} */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

/** @type {string | undefined} */
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Shared Supabase client. Safe to import from any module.
 * If URL/key are missing, the client is still created with empty strings so imports never throw;
 * calls will fail until `.env` is configured (see `testSupabaseConnection`).
 */
export const supabase = createClient(
  supabaseUrl ?? "",
  supabaseAnonKey ?? ""
);

/**
 * Quick connectivity check: runs `select` on the `services` table (limit 1).
 * Use from DevTools console or a temporary admin/debug button — not wired to UI in this step.
 *
 * @returns {Promise<{ ok: boolean, data: unknown, error: Error | null, message?: string }>}
 */
export async function testSupabaseConnection() {
  if (!supabaseUrl?.trim() || !supabaseAnonKey?.trim()) {
    return {
      ok: false,
      data: null,
      error: null,
      message:
        "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env and add your project values.",
    };
  }

  const { data, error } = await supabase.from("services").select("*").limit(1);

  if (error) {
    return {
      ok: false,
      data: null,
      error,
      message: error.message,
    };
  }

  return {
    ok: true,
    data,
    error: null,
  };
}
