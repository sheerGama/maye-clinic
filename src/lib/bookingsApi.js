/**
 * Booking flow: read active services, insert booking rows.
 * Uses anon Supabase client — subject to RLS.
 */

import { supabase } from "./supabaseClient.js";
import { mapServiceRow } from "./catalogApi.js";
import { isRlsOrWritePolicyError } from "./adminCatalogApi.js";

const SERVICE_TYPE_AR = {
  skin: "جلسات البشرة",
  laser: "جلسات الليزر",
};

/**
 * Map DB service row for booking UI + Arabic serviceType label.
 */
export function mapBookingServiceRow(row) {
  const base = mapServiceRow(row);
  const cat = base.category;
  const serviceType =
    cat === "skin"
      ? SERVICE_TYPE_AR.skin
      : cat === "laser"
        ? SERVICE_TYPE_AR.laser
        : "";

  return {
    ...base,
    serviceType,
  };
}

/**
 * Active services for booking dropdown, newest first.
 * @returns {Promise<{ data: ReturnType<typeof mapBookingServiceRow>[] | null, error: Error | null }>}
 */
export async function getBookingServices() {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) return { data: null, error };
  const mapped = (data ?? []).map(mapBookingServiceRow);
  return { data: mapped, error: null };
}

/**
 * Insert a booking. Pass frontend-shaped payload; maps to DB columns.
 *
 * @param {{
 *   fullName: string,
 *   phone: string,
 *   serviceId: string | null,
 *   serviceName: string,
 *   serviceType: string,
 *   date: string,
 *   time: string,
 *   notes: string
 * }} booking
 */
export async function createBooking(booking) {
  const notes = booking.notes?.trim() ?? "";

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      full_name: booking.fullName,
      phone: booking.phone,
      service_id: booking.serviceId ?? null,
      service_name: booking.serviceName,
      service_type: booking.serviceType,
      date: booking.date,
      time: booking.time,
      notes: notes || null,
      status: "جديد",
    })
    .select()
    .single();

  return { data, error };
}

/** Re-export for Booking.jsx submit messaging */
export { isRlsOrWritePolicyError };

/**
 * Normalize Supabase booking row to Report 02 localStorage backup shape.
 */
export function supabaseBookingToBackupShape(row) {
  if (!row) return null;
  let timeStr = row.time;
  if (typeof timeStr === "string" && timeStr.length >= 5) {
    timeStr = timeStr.substring(0, 5);
  } else if (timeStr != null) {
    timeStr = String(timeStr);
  } else {
    timeStr = "";
  }
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    serviceName: row.service_name,
    serviceType: row.service_type,
    date: row.date,
    time: timeStr,
    notes: row.notes ?? "",
    status: row.status ?? "جديد",
    createdAt: row.created_at,
  };
}
