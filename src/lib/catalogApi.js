/**
 * Catalog reads from Supabase (services, products).
 * Maps DB columns to shapes expected by Services.jsx / Shop.jsx (desc, images[], price as Number).
 */

import { supabase } from "./supabaseClient.js";

/** Single placeholder when image_url is null — keeps item.images[0] safe for cards/modal */
export const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="#efe5dc" width="100%" height="100%"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9c8b7a" font-family="sans-serif" font-size="14">Maye Clinic</text></svg>`
  );

function toNumberPrice(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {Record<string, unknown>} row — Supabase services row
 * @returns {{ id: string, name: string, desc: string, price: number, category: string, image: string, image_url: string, images: string[] }}
 */
export function mapServiceRow(row) {
  const desc = row.description != null ? String(row.description) : "";
  const imageUrl = row.image_url != null ? String(row.image_url) : "";
  const image = imageUrl || PLACEHOLDER_IMAGE;
  const images = imageUrl ? [imageUrl] : [PLACEHOLDER_IMAGE];

  return {
    id: row.id,
    name: String(row.name ?? ""),
    desc,
    price: toNumberPrice(row.price),
    category: String(row.category ?? ""),
    image,
    image_url: imageUrl,
    images,
  };
}

/**
 * @param {Record<string, unknown>} row — Supabase products row
 * @returns {{ id: string, name: string, desc: string, price: number, image: string, image_url: string, type: 'product', images: string[] }}
 */
export function mapProductRow(row) {
  const desc = row.description != null ? String(row.description) : "";
  const imageUrl = row.image_url != null ? String(row.image_url) : "";
  const image = imageUrl || PLACEHOLDER_IMAGE;
  const images = imageUrl ? [imageUrl] : [PLACEHOLDER_IMAGE];

  return {
    id: row.id,
    name: String(row.name ?? ""),
    desc,
    price: toNumberPrice(row.price),
    image,
    image_url: imageUrl,
    type: "product",
    images,
  };
}

/**
 * Active services, newest first.
 * @returns {Promise<{ data: Array<ReturnType<typeof mapServiceRow>> | null, error: Error | null }>}
 */
export async function getServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  const mapped = (data ?? []).map(mapServiceRow);
  return { data: mapped, error: null };
}

/**
 * Active products, newest first.
 * @returns {Promise<{ data: ReturnType<typeof mapProductRow>[] | null, error: Error | null }>}
 */
export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  const mapped = (data ?? []).map(mapProductRow);
  return { data: mapped, error: null };
}
