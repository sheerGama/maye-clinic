/**
 * Admin catalog writes + full reads (including inactive rows) for Maye Clinic.
 * Uses the anon Supabase client — subject to RLS. No service role.
 */

import { supabase } from "./supabaseClient.js";
import { mapProductRow, mapServiceRow } from "./catalogApi.js";

function toNumberPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Detect RLS / permission failures for user-friendly Arabic messages */
export function isRlsOrWritePolicyError(error) {
  if (!error) return false;
  const code = error.code;
  const msg = String(error.message || "").toLowerCase();
  return (
    code === "42501" ||
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("new row violates row-level security")
  );
}

export function mapServiceRowAdmin(row) {
  const base = mapServiceRow(row);
  return {
    ...base,
    is_active: row.is_active !== false,
  };
}

export function mapProductRowAdmin(row) {
  const base = mapProductRow(row);
  return {
    ...base,
    is_active: row.is_active !== false,
  };
}

/** All services (active + inactive) for admin — newest first */
export async function fetchAllServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

/** All products for admin — newest first */
export async function fetchAllProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  return { data, error };
}

/**
 * @param {{ name: string, description?: string, price: number|string, category: 'skin'|'laser', image_url?: string|null }} input
 */
export async function createService(input) {
  const { data, error } = await supabase
    .from("services")
    .insert({
      name: input.name,
      description: input.description ?? "",
      price: toNumberPrice(input.price),
      category: input.category,
      image_url: input.image_url ?? null,
      is_active: true,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * @param {string} id — uuid
 * @param {{ name?: string, description?: string, price?: number|string, category?: string, image_url?: string|null, is_active?: boolean }} patch
 */
export async function updateService(id, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.price !== undefined) payload.price = toNumberPrice(patch.price);
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.image_url !== undefined) payload.image_url = patch.image_url;
  if (patch.is_active !== undefined) payload.is_active = patch.is_active;

  const { data, error } = await supabase
    .from("services")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteService(id) {
  return updateService(id, { is_active: false });
}

/**
 * @param {{ name: string, description?: string, price: number|string, image_url?: string|null }} input
 */
export async function createProduct(input) {
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name,
      description: input.description ?? "",
      price: toNumberPrice(input.price),
      image_url: input.image_url ?? null,
      is_active: true,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * @param {string} id
 * @param {{ name?: string, description?: string, price?: number|string, image_url?: string|null, is_active?: boolean }} patch
 */
export async function updateProduct(id, patch) {
  const payload = {};
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.price !== undefined) payload.price = toNumberPrice(patch.price);
  if (patch.image_url !== undefined) payload.image_url = patch.image_url;
  if (patch.is_active !== undefined) payload.is_active = patch.is_active;

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteProduct(id) {
  return updateProduct(id, { is_active: false });
}

/** Map DB row to admin UI item (desc, images[], price number) */
export function rowToAdminServiceItem(row) {
  return mapServiceRowAdmin(row);
}

export function rowToAdminProductItem(row) {
  return mapProductRowAdmin(row);
}
