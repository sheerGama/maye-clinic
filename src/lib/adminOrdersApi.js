/**
 * Admin dashboard: read/update bookings and orders (anon client, RLS).
 */

import { supabase } from "./supabaseClient.js";

function formatBookingTime(row) {
  const t = row.time;
  if (t == null) return "";
  if (typeof t === "string" && t.length >= 5) return t.substring(0, 5);
  return String(t);
}

/**
 * Map Supabase bookings row → frontend object
 */
export function mapBookingRow(row) {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    serviceName: row.service_name,
    serviceType: row.service_type,
    date: row.date,
    time: formatBookingTime(row),
    notes: row.notes ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function fetchBookings() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  return { data: (data ?? []).map(mapBookingRow), error: null };
}

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

/**
 * Map orders + grouped order_items → frontend order object
 */
export function mapOrderWithItems(orderRow, lineRows) {
  return {
    id: orderRow.id,
    customer: {
      fullName: orderRow.full_name,
      phone: orderRow.phone,
      city: orderRow.city,
      address: orderRow.address,
      notes: orderRow.notes ?? "",
    },
    items: (lineRows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      item_type: r.item_type,
      price: Number(r.price),
      quantity: r.quantity,
      line_subtotal: Number(r.line_subtotal),
    })),
    total: Number(orderRow.total),
    status: orderRow.status,
    createdAt: orderRow.created_at,
  };
}

export async function fetchOrdersWithItems() {
  const { data: orders, error: e1 } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (e1) return { data: null, error: e1 };

  const { data: allItems, error: e2 } = await supabase
    .from("order_items")
    .select("*");

  if (e2) return { data: null, error: e2 };

  const byOrder = {};
  for (const row of allItems ?? []) {
    const oid = row.order_id;
    if (!byOrder[oid]) byOrder[oid] = [];
    byOrder[oid].push(row);
  }

  const mapped = (orders ?? []).map((o) =>
    mapOrderWithItems(o, byOrder[o.id] ?? [])
  );

  return { data: mapped, error: null };
}

export async function updateOrderStatus(id, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}
