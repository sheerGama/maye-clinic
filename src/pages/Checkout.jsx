import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createFullOrder, supabaseOrderToBackupShape } from "../lib/ordersApi.js";
import { isRlsOrWritePolicyError } from "../lib/adminCatalogApi.js";
import "./checkout.css";

const CART_KEY = "cart-items";
const ORDERS_KEY = "order-items";

/**
 * رقم واتساب العيادة بصيغة دولية بدون + (مثال: 972501234567).
 * غيّر القيمة ليتوافق مع رقم الاستقبال الفعلي.
 */
const CLINIC_WHATSAPP_E164 = "972500000000";

const INITIAL_FORM = {
  fullName: "",
  phone: "",
  city: "",
  address: "",
  notes: "",
};

function loadCartItems() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (raw == null || raw === "") return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((rawItem, index) => normalizeCartLine(rawItem, index))
      .filter(Boolean);
  } catch {
    return [];
  }
}

function normalizeCartLine(raw, index) {
  if (raw == null || typeof raw !== "object") return null;

  const qtyRaw = raw.quantity;
  let quantity = 1;
  if (qtyRaw != null && qtyRaw !== "") {
    const n = Number(qtyRaw);
    if (Number.isFinite(n) && n >= 1) quantity = Math.floor(n);
  }

  const priceNum = Number(raw.price);
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0;

  const id =
    raw.id != null && raw.id !== ""
      ? raw.id
      : `line-${index}-${Date.now()}`;

  const name =
    typeof raw.name === "string" && raw.name.trim()
      ? raw.name.trim()
      : "بدون اسم";

  let type;
  if (raw.type === "service") type = "service";
  else if (raw.type === "product") type = "product";
  else type = undefined;

  return {
    id,
    name,
    price,
    quantity,
    type,
    image: raw.image,
    lineSubtotal: price * quantity,
  };
}

function typeLabel(type) {
  if (type === "service") return "جلسة";
  if (type === "product") return "منتج";
  return "غير محدد";
}

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function buildWhatsAppUrl(orderId, customer, items, total) {
  const lines = [
    "طلب جديد — Maye Clinic / ذوق",
    `رقم الطلب: ${orderId}`,
    `الاسم: ${customer.fullName}`,
    `الهاتف: ${customer.phone}`,
    `المدينة: ${customer.city}`,
    `العنوان: ${customer.address}`,
    customer.notes ? `ملاحظات: ${customer.notes}` : null,
    "",
    "العناصر:",
    ...items.map(
      (it) =>
        `• ${it.name} (${typeLabel(it.type)}) ×${it.quantity} — ${it.lineSubtotal} ₪`
    ),
    "",
    `الإجمالي: ${total} ₪`,
  ].filter((x) => x != null);

  const text = lines.join("\n");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${CLINIC_WHATSAPP_E164}?text=${encoded}`;
}

export default function Checkout() {
  const [lines, setLines] = useState(() => loadCartItems());
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [completedOrder, setCompletedOrder] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.lineSubtotal, 0),
    [lines]
  );

  const total = subtotal;

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const next = { ...e };
        delete next[field];
        return next;
      });
    }
    if (submitError) setSubmitError("");
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = "الرجاء إدخال الاسم الكامل";

    const phone = form.phone.trim().replace(/\s/g, "");
    if (!phone) next.phone = "الرجاء إدخال رقم الهاتف";
    else if (phone.replace(/\D/g, "").length < 9)
      next.phone = "رقم الهاتف يبدو غير مكتمل";

    if (!form.city.trim()) next.city = "الرجاء إدخال المدينة";
    if (!form.address.trim()) next.address = "الرجاء إدخال العنوان";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (lines.length === 0) return;
    if (!validate()) return;

    setSubmitError("");
    setSubmitting(true);

    const customer = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim().replace(/\s/g, ""),
      city: form.city.trim(),
      address: form.address.trim(),
      notes: form.notes.trim(),
    };

    const orderPayload = { customer, total };

    const { data, error } = await createFullOrder(orderPayload, lines);

    setSubmitting(false);

    if (error) {
      /** @type {any} */
      const err = error;
      if (err.isPartialFailure) {
        setSubmitError(
          err.message ||
            "تم إنشاء الطلب لكن فشل حفظ العناصر. السلة لم تُفرغ — راجع قاعدة البيانات."
        );
        return;
      }
      if (isRlsOrWritePolicyError(error)) {
        setSubmitError(
          "لا تسمح سياسات الأمان (RLS) أو الصلاحيات حالياً بإتمام الطلب. راجع إعدادات Supabase أو شغّل ملف order_select_policies_prototype.sql إن لزم."
        );
        return;
      }
      setSubmitError(
        `تعذر إتمام الطلب: ${error?.message || "خطأ في الشبكة أو الخادم"}`
      );
      return;
    }

    if (!data?.order) {
      setSubmitError("لم يتم إرجاع بيانات الطلب من الخادم.");
      return;
    }

    const backup = supabaseOrderToBackupShape(data.order, data.items);
    if (!backup) {
      setSubmitError("تعذر تجهيز نسخة احتياطية من الطلب.");
      return;
    }

    const orders = loadOrders();
    orders.push(backup);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    localStorage.removeItem(CART_KEY);

    setLines([]);
    setForm(INITIAL_FORM);
    setErrors({});
    setCompletedOrder(backup);
  };

  if (lines.length === 0 && !completedOrder) {
    return (
      <div className="checkoutPage">
        <div className="checkoutInner">
          <header className="checkoutHeader">
            <p className="checkoutEyebrow">Maye Clinic</p>
            <h1 className="checkoutTitle">إتمام الطلب</h1>
          </header>
          <div className="checkoutEmpty">
            <h2>السلة فارغة</h2>
            <p>
              لا توجد منتجات أو جلسات في السلة. تسوّقي من المتجر ثم عودي لإتمام
              الطلب.
            </p>
            <Link to="/shop">الانتقال إلى المتجر</Link>
          </div>
        </div>
      </div>
    );
  }

  if (completedOrder) {
    const waUrl = buildWhatsAppUrl(
      completedOrder.id,
      completedOrder.customer,
      completedOrder.items,
      completedOrder.total
    );

    return (
      <div className="checkoutPage">
        <div className="checkoutInner">
          <div className="checkoutCard">
            <div className="checkoutSuccess">
              <div className="checkoutSuccessBadge" aria-hidden>
                ✓
              </div>
              <h1 className="checkoutTitle" style={{ marginBottom: 8 }}>
                تم استلام طلبك بنجاح
              </h1>
              <p className="checkoutSubtitle">
                شكراً لثقتك بعيادة Maye Clinic. رقم الطلب الخاص بك:
              </p>
              <div className="checkoutOrderId">{completedOrder.id}</div>
              <p className="checkoutSubtitle" style={{ marginTop: 16 }}>
                يمكنك إرسال تفاصيل الطلب عبر واتساب للمتابعة السريعة.
              </p>
              <a
                className="checkoutWa"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                إرسال الطلب عبر واتساب
              </a>
              <div>
                <Link className="checkoutBackLink" to="/shop">
                  العودة إلى المتجر
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkoutPage">
      <div className="checkoutInner">
        <header className="checkoutHeader">
          <p className="checkoutEyebrow">Maye Clinic</p>
          <h1 className="checkoutTitle">إتمام الطلب</h1>
          <p className="checkoutSubtitle">
            راجعي ملخص الطلب ثم أدخلي بيانات التوصيل لإتمام الشراء.
          </p>
        </header>

        <section className="checkoutCard" aria-labelledby="summary-title">
          <h2 id="summary-title" className="checkoutCardTitle">
            ملخص الطلب
          </h2>
          {lines.map((line, idx) => (
            <div key={`${line.id}-${idx}`} className="checkoutLine">
              <div>
                <div>{line.name}</div>
                <div className="checkoutLineMeta">
                  الفئة: {typeLabel(line.type)} • الكمية: {line.quantity}
                </div>
              </div>
              <div className="checkoutLinePrice">{line.lineSubtotal} ₪</div>
            </div>
          ))}
          <div className="checkoutTotals">
            <div className="checkoutSubRow">
              <span>المجموع الفرعي</span>
              <span>{subtotal} ₪</span>
            </div>
            <div className="checkoutTotalRow">
              <span>الإجمالي</span>
              <span>{total} ₪</span>
            </div>
          </div>
        </section>

        <form className="checkoutCard" onSubmit={handleSubmit} noValidate>
          <h2 className="checkoutCardTitle">بيانات العميل</h2>

          {submitError && (
            <div className="checkoutSubmitErr" role="alert">
              {submitError}
            </div>
          )}

          <div className="checkoutField">
            <label htmlFor="co-fullName">
              الاسم الكامل<span className="req">*</span>
            </label>
            <input
              id="co-fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              aria-invalid={!!errors.fullName}
            />
            {errors.fullName && (
              <span className="checkoutError">{errors.fullName}</span>
            )}
          </div>

          <div className="checkoutField">
            <label htmlFor="co-phone">
              رقم الهاتف<span className="req">*</span>
            </label>
            <input
              id="co-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="مثال: 0501234567"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <span className="checkoutError">{errors.phone}</span>
            )}
          </div>

          <div className="checkoutField">
            <label htmlFor="co-city">
              المدينة<span className="req">*</span>
            </label>
            <input
              id="co-city"
              type="text"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              aria-invalid={!!errors.city}
            />
            {errors.city && (
              <span className="checkoutError">{errors.city}</span>
            )}
          </div>

          <div className="checkoutField">
            <label htmlFor="co-address">
              العنوان<span className="req">*</span>
            </label>
            <input
              id="co-address"
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <span className="checkoutError">{errors.address}</span>
            )}
          </div>

          <div className="checkoutField">
            <label htmlFor="co-notes">ملاحظات (اختياري)</label>
            <textarea
              id="co-notes"
              rows={3}
              placeholder="تعليمات التوصيل أو أي ملاحظة…"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="checkoutSubmit"
            disabled={submitting}
          >
            {submitting ? "جاري الإرسال…" : "تأكيد الطلب"}
          </button>
        </form>
      </div>
    </div>
  );
}
