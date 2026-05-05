import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { createFullOrder, supabaseOrderToBackupShape } from "../lib/ordersApi.js";
import { isRlsOrWritePolicyError } from "../lib/adminCatalogApi.js";
import "./checkout.css";
import { useLanguage } from "../i18n/LanguageContext";

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

function typeLabel(type, t) {
  if (type === "service") return t("common.serviceType");
  if (type === "product") return t("common.productType");
  return t("common.notSpecified");
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

function buildWhatsAppUrl(orderId, customer, items, total, t) {
  const lines = [
    t("checkout.orderNewMessage"),
    `${t("checkout.whatsapp.orderNumber")}: ${orderId}`,
    `${t("checkout.whatsapp.name")}: ${customer.fullName}`,
    `${t("checkout.whatsapp.phone")}: ${customer.phone}`,
    `${t("checkout.whatsapp.city")}: ${customer.city}`,
    `${t("checkout.whatsapp.address")}: ${customer.address}`,
    customer.notes ? `${t("checkout.whatsapp.notes")}: ${customer.notes}` : null,
    "",
    `${t("checkout.whatsapp.items")}:`,
    ...items.map(
      (it) =>
        `• ${it.name} (${typeLabel(it.type, t)}) ×${it.quantity} — ${it.lineSubtotal} ₪`
    ),
    "",
    `${t("checkout.whatsapp.total")}: ${total} ₪`,
  ].filter((x) => x != null);

  const text = lines.join("\n");
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${CLINIC_WHATSAPP_E164}?text=${encoded}`;
}

export default function Checkout() {
  const { t } = useLanguage();
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
    if (!form.fullName.trim()) next.fullName = t("checkout.validation.fullName");

    const phone = form.phone.trim().replace(/\s/g, "");
    if (!phone) next.phone = t("checkout.validation.phone");
    else if (phone.replace(/\D/g, "").length < 9)
      next.phone = t("checkout.validation.phoneIncomplete");

    if (!form.city.trim()) next.city = t("checkout.validation.city");
    if (!form.address.trim()) next.address = t("checkout.validation.address");

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
            t("checkout.submitErrors.partial")
        );
        return;
      }
      if (isRlsOrWritePolicyError(error)) {
        setSubmitError(
          t("checkout.submitErrors.rls")
        );
        return;
      }
      setSubmitError(t("checkout.submitErrors.generic", { message: error?.message || "Server or network error" }));
      return;
    }

    if (!data?.order) {
      setSubmitError(t("checkout.submitErrors.noData"));
      return;
    }

    const backup = supabaseOrderToBackupShape(data.order, data.items);
    if (!backup) {
      setSubmitError(t("checkout.submitErrors.backup"));
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
            <h1 className="checkoutTitle">{t("checkout.title")}</h1>
          </header>
          <div className="checkoutEmpty">
            <h2>{t("checkout.emptyTitle")}</h2>
            <p>
              {t("checkout.emptyBody")}
            </p>
            <Link to="/shop">{t("checkout.goToShop")}</Link>
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
      completedOrder.total,
      t
    );

    return (
      <div className="checkoutPage">
        <div className="checkoutInner">
          <div className="checkoutCard">
            <div className="checkoutSuccess">
              <div className="checkoutSuccessBadge" aria-hidden>
                ✓
              </div>
              <h1 className="checkoutTitle">
                {t("checkout.successTitle")}
              </h1>
              <p className="checkoutSubtitle">
                {t("checkout.successSubtitle")}
              </p>
              <div className="checkoutOrderId">{completedOrder.id}</div>
              <p className="checkoutSubtitle checkoutSubtitle--spaced">
                {t("checkout.successWhatsAppHint")}
              </p>
              <a
                className="checkoutWa"
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("checkout.sendWhatsApp")}
              </a>
              <div>
                <Link className="checkoutBackLink" to="/shop">
                  {t("checkout.backToShop")}
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
          <h1 className="checkoutTitle">{t("checkout.title")}</h1>
          <p className="checkoutSubtitle">
            {t("checkout.subtitle")}
          </p>
        </header>

        <section className="checkoutCard" aria-labelledby="summary-title">
          <h2 id="summary-title" className="checkoutCardTitle">
            {t("checkout.summary")}
          </h2>
          {lines.map((line, idx) => (
            <div key={`${line.id}-${idx}`} className="checkoutLine">
              <div>
                <div>{line.name}</div>
                <div className="checkoutLineMeta">
                  {t("checkout.category")}: {typeLabel(line.type, t)} • {t("checkout.quantity")}: {line.quantity}
                </div>
              </div>
              <div className="checkoutLinePrice">{line.lineSubtotal} ₪</div>
            </div>
          ))}
          <div className="checkoutTotals">
            <div className="checkoutSubRow">
              <span>{t("checkout.subtotal")}</span>
              <span>{subtotal} ₪</span>
            </div>
            <div className="checkoutTotalRow">
              <span>{t("checkout.total")}</span>
              <span>{total} ₪</span>
            </div>
          </div>
        </section>

        <form className="checkoutCard" onSubmit={handleSubmit} noValidate>
          <h2 className="checkoutCardTitle">{t("checkout.customerDetails")}</h2>

          {submitError && (
            <div className="checkoutSubmitErr" role="alert">
              {submitError}
            </div>
          )}

          <div className="checkoutField">
            <label htmlFor="co-fullName">
              {t("checkout.fullName")}<span className="req">*</span>
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
              {t("checkout.phone")}<span className="req">*</span>
            </label>
            <input
              id="co-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("checkout.phonePlaceholder")}
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
              {t("checkout.city")}<span className="req">*</span>
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
              {t("checkout.address")}<span className="req">*</span>
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
            <label htmlFor="co-notes">{t("checkout.notesOptional")}</label>
            <textarea
              id="co-notes"
              rows={3}
              placeholder={t("checkout.notesPlaceholder")}
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="checkoutSubmit"
            disabled={submitting}
          >
            {submitting ? t("checkout.submitting") : t("checkout.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
