/**
 * Checkout orders: insert orders + order_items via anon Supabase client (RLS).
 */

import { supabase } from "./supabaseClient.js";

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * @param {{ customer: { fullName: string, phone: string, city: string, address: string, notes?: string }, total: number }} orderPayload
 */
export async function createOrder(orderPayload) {
  const c = orderPayload.customer;
  const notes = c.notes?.trim() ?? "";

  const { data, error } = await supabase
    .from("orders")
    .insert({
      full_name: c.fullName,
      phone: c.phone,
      city: c.city,
      address: c.address,
      notes: notes || null,
      total: toNum(orderPayload.total),
      status: "جديد",
    })
    .select()
    .single();

  return { data, error };
}

/**
 * @param {string} orderId — uuid
 * @param {Array<Record<string, unknown>>} items — cart lines (normalized)
 */
export async function createOrderItems(orderId, items) {
  const rows = items.map((item) => {
    const qty = toNum(item.quantity ?? 1) || 1;
    const price = toNum(item.price);
    const lineSubtotal = toNum(
      item.lineSubtotal ?? price * qty
    );

    return {
      order_id: orderId,
      item_id: item.id != null ? String(item.id) : null,
      item_type: item.type ?? item.item_type ?? null,
      name: String(item.name ?? ""),
      price,
      quantity: Math.max(1, Math.floor(qty)),
      line_subtotal: lineSubtotal,
    };
  });

  const { data, error } = await supabase
    .from("order_items")
    .insert(rows)
    .select();

  return { data, error };
}

/**
 * Create order then line items. Does not roll back order if items fail (prototype).
 * @returns {{ data: { order: object, items: object[] | null } | null, error: Error | object | null }}
 */
export async function createFullOrder(orderPayload, items) {
  const { data: order, error: orderErr } = await createOrder(orderPayload);

  if (orderErr || !order) {
    return { data: null, error: orderErr };
  }

  const { data: orderItems, error: itemsErr } = await createOrderItems(
    order.id,
    items
  );

  if (itemsErr) {
    const wrapped = new Error(
      `تم إنشاء الطلب في قاعدة البيانات (رقم ${order.id}) لكن فشل حفظ بنود السطر: ${itemsErr.message || "خطأ غير معروف"}`
    );
    wrapped.name = "OrderItemsInsertFailed";
    /** @type {any} */
    const w = wrapped;
    w.isPartialFailure = true;
    w.orderRow = order;
    w.cause = itemsErr;

    return {
      data: { order, items: null },
      error: wrapped,
    };
  }

  return {
    data: { order, items: orderItems ?? [] },
    error: null,
  };
}

/**
 * Map Supabase rows to Report 03 localStorage backup shape.
 */
export function supabaseOrderToBackupShape(orderRow, itemRows) {
  if (!orderRow) return null;
  return {
    id: orderRow.id,
    customer: {
      fullName: orderRow.full_name,
      phone: orderRow.phone,
      city: orderRow.city,
      address: orderRow.address,
      notes: orderRow.notes ?? "",
    },
    items: (itemRows || []).map((r) => ({
      id: r.item_id,
      name: r.name,
      price: Number(r.price),
      quantity: r.quantity,
      type: r.item_type,
      lineSubtotal: Number(r.line_subtotal),
    })),
    total: Number(orderRow.total),
    status: orderRow.status ?? "جديد",
    createdAt: orderRow.created_at,
  };
}
