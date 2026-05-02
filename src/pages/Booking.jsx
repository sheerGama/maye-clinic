import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  getBookingServices,
  createBooking,
  supabaseBookingToBackupShape,
  isRlsOrWritePolicyError,
} from "../lib/bookingsApi.js";
import "./booking.css";

const STORAGE_SKIN = "skin-items";
const STORAGE_LASER = "laser-items";
const STORAGE_BOOKINGS = "booking-items";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  serviceKey: "",
  date: "",
  time: "",
  notes: "",
};

function loadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Supports numeric ids (local) and UUIDs (Supabase) */
function parseServiceKey(key) {
  if (!key || typeof key !== "string") return null;
  const idx = key.indexOf(":");
  if (idx < 0) return null;
  const type = key.slice(0, idx);
  const id = key.slice(idx + 1);
  if (type !== "skin" && type !== "laser") return null;
  if (!id) return null;
  return { type, id };
}

export default function Booking() {
  const [skinItems, setSkinItems] = useState([]);
  const [laserItems, setLaserItems] = useState([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingServices(true);
      const { data, error } = await getBookingServices();

      if (cancelled) return;

      if (!error && data?.length > 0) {
        setUseLocalFallback(false);
        setSkinItems(data.filter((s) => s.category === "skin"));
        setLaserItems(data.filter((s) => s.category === "laser"));
      } else {
        setUseLocalFallback(true);
        setSkinItems(loadJson(STORAGE_SKIN));
        setLaserItems(loadJson(STORAGE_LASER));
      }

      setLoadingServices(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const hasServices = skinItems.length > 0 || laserItems.length > 0;

  const serviceOptions = useMemo(() => {
    const skin = skinItems.map((item) => ({
      key: `skin:${item.id}`,
      label: `${item.name} — ${item.serviceType ?? "جلسات البشرة"}`,
      name: item.name,
      serviceType: item.serviceType ?? "جلسات البشرة",
    }));
    const laser = laserItems.map((item) => ({
      key: `laser:${item.id}`,
      label: `${item.name} — ${item.serviceType ?? "جلسات الليزر"}`,
      name: item.name,
      serviceType: item.serviceType ?? "جلسات الليزر",
    }));
    return [...skin, ...laser];
  }, [skinItems, laserItems]);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
    if (success) setSuccess(false);
    if (submitError) setSubmitError("");
  };

  const validate = () => {
    const next = {};
    const name = form.fullName.trim();
    if (!name) next.fullName = "الرجاء إدخال الاسم الكامل";

    const phone = form.phone.trim().replace(/\s/g, "");
    if (!phone) next.phone = "الرجاء إدخال رقم الهاتف";
    else if (phone.replace(/\D/g, "").length < 9)
      next.phone = "رقم الهاتف يبدو غير مكتمل";

    if (!form.serviceKey) next.serviceKey = "الرجاء اختيار خدمة";

    if (!form.date) next.date = "الرجاء اختيار التاريخ";

    if (!form.time) next.time = "الرجاء اختيار الوقت";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!hasServices) return;
    if (!validate()) return;

    const parsed = parseServiceKey(form.serviceKey);
    if (!parsed) {
      setErrors({ serviceKey: "تعذر تحديد الخدمة المختارة" });
      return;
    }

    const list = parsed.type === "skin" ? skinItems : laserItems;
    const service = list.find((i) => String(i.id) === String(parsed.id));
    if (!service) {
      setErrors({
        serviceKey: "الخدمة غير متوفرة بعد الآن. أعد اختيار الخدمة.",
      });
      return;
    }

    setSubmitError("");

    if (useLocalFallback) {
      const serviceTypeLabel =
        parsed.type === "skin" ? "جلسات البشرة" : "جلسات الليزر";

      const booking = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        fullName: form.fullName.trim(),
        phone: form.phone.trim().replace(/\s/g, ""),
        serviceName: service.name,
        serviceType: serviceTypeLabel,
        date: form.date,
        time: form.time,
        notes: form.notes.trim(),
        status: "جديد",
        createdAt: new Date().toISOString(),
      };

      const existing = loadJson(STORAGE_BOOKINGS);
      existing.push(booking);
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(existing));

      setForm(INITIAL_FORM);
      setErrors({});
      setSuccess(true);
      return;
    }

    const { data, error } = await createBooking({
      fullName: form.fullName.trim(),
      phone: form.phone.trim().replace(/\s/g, ""),
      serviceId: String(service.id),
      serviceName: service.name,
      serviceType: service.serviceType,
      date: form.date,
      time: form.time,
      notes: form.notes.trim(),
    });

    if (error) {
      if (isRlsOrWritePolicyError(error)) {
        setSubmitError(
          "لا تسمح سياسات الأمان (RLS) حالياً بحفظ الحجز. راجع إعدادات Supabase أو اتصل بالمسؤول."
        );
      } else {
        setSubmitError(
          `تعذر إرسال الحجز: ${error.message || "خطأ غير معروف"}`
        );
      }
      return;
    }

    const backup = supabaseBookingToBackupShape(data);
    if (backup) {
      const existing = loadJson(STORAGE_BOOKINGS);
      existing.push(backup);
      localStorage.setItem(STORAGE_BOOKINGS, JSON.stringify(existing));
    }

    setForm(INITIAL_FORM);
    setErrors({});
    setSuccess(true);
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loadingServices) {
    return (
      <div className="bookingPage">
        <div className="bookingInner">
          <p className="bookingLoading" role="status">
            جاري تحميل الخدمات…
          </p>
        </div>
      </div>
    );
  }

  if (!hasServices) {
    return (
      <div className="bookingPage">
        <div className="bookingInner">
          <header className="bookingHeader">
            <p className="bookingEyebrow">Maye Clinic</p>
            <h1 className="bookingTitle">حجز موعد</h1>
          </header>
          <div className="bookingEmpty">
            <h2>لا توجد خدمات متاحة للحجز بعد</h2>
            <p>
              يرجى إضافة خدمات البشرة أو الليزر من لوحة التحكم أولاً، ثم العودة
              لإكمال الحجز.
            </p>
            <Link to="/admin">الانتقال إلى لوحة التحكم</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bookingPage">
      <div className="bookingInner">
        <header className="bookingHeader">
          <p className="bookingEyebrow">Maye Clinic</p>
          <h1 className="bookingTitle">حجز موعد</h1>
          <p className="bookingSubtitle">
            املئي النموذج أدناه وسنتواصل معك لتأكيد الموعد بأسرع وقت.
          </p>
        </header>

        {useLocalFallback && (
          <div className="bookingWarn" role="status">
            يتم عرض الخدمات من التخزين المحلي لأن تحميل الخدمات من السيرفر تعذر أو
            لا توجد بيانات. سيتم حفظ طلب الحجز محلياً فقط حتى يعود الاتصال.
          </div>
        )}

        <form className="bookingCard" onSubmit={handleSubmit} noValidate>
          {submitError && (
            <div className="bookingSubmitError" role="alert">
              {submitError}
            </div>
          )}

          <div className="bookingField">
            <label htmlFor="fullName">
              الاسم الكامل<span className="req">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <span className="bookingError">{errors.fullName}</span>
            )}
          </div>

          <div className="bookingField">
            <label htmlFor="phone">
              رقم الهاتف<span className="req">*</span>
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="مثال: 0501234567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <span className="bookingError">{errors.phone}</span>
            )}
          </div>

          <div className="bookingField">
            <label htmlFor="serviceKey">
              الخدمة<span className="req">*</span>
            </label>
            <select
              id="serviceKey"
              value={form.serviceKey}
              onChange={(e) => update("serviceKey", e.target.value)}
              aria-invalid={!!errors.serviceKey}
            >
              <option value="">— اختاري الخدمة —</option>
              {serviceOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            {errors.serviceKey && (
              <span className="bookingError">{errors.serviceKey}</span>
            )}
          </div>

          <div className="bookingField">
            <label htmlFor="date">
              التاريخ<span className="req">*</span>
            </label>
            <input
              id="date"
              type="date"
              min={today}
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              aria-invalid={!!errors.date}
            />
            {errors.date && (
              <span className="bookingError">{errors.date}</span>
            )}
          </div>

          <div className="bookingField">
            <label htmlFor="time">
              الوقت<span className="req">*</span>
            </label>
            <input
              id="time"
              type="time"
              value={form.time}
              onChange={(e) => update("time", e.target.value)}
              aria-invalid={!!errors.time}
            />
            {errors.time && (
              <span className="bookingError">{errors.time}</span>
            )}
          </div>

          <div className="bookingField">
            <label htmlFor="notes">ملاحظات (اختياري)</label>
            <textarea
              id="notes"
              rows={3}
              placeholder="أي تفاصيل تودين مشاركتها مع العيادة…"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <button type="submit" className="bookingSubmit">
            إرسال طلب الحجز
          </button>

          {success && (
            <p className="bookingSuccess" role="status">
              تم استلام طلبك بنجاح. سنتواصل معك قريباً لتأكيد الموعد.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
