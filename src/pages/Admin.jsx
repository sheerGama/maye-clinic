import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAllServices,
  fetchAllProducts,
  createService,
  updateService,
  deleteService,
  createProduct,
  updateProduct,
  deleteProduct,
  rowToAdminServiceItem,
  rowToAdminProductItem,
  isRlsOrWritePolicyError,
} from "../lib/adminCatalogApi.js";
import {
  fetchBookings,
  fetchOrdersWithItems,
  updateBookingStatus,
  updateOrderStatus,
  mapBookingRow,
} from "../lib/adminOrdersApi.js";

const BOOKING_STATUS_OPTIONS = ["جديد", "مؤكد", "مكتمل", "ملغي"];
const ORDER_STATUS_OPTIONS = ["جديد", "قيد التجهيز", "مكتمل", "ملغي"];

const BOOKING_LS = "booking-items";
const ORDER_LS = "order-items";

function loadBookingsFromLs() {
  try {
    const raw = localStorage.getItem(BOOKING_LS);
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function loadOrdersFromLs() {
  try {
    const raw = localStorage.getItem(ORDER_LS);
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function formatDt(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return String(iso);
  }
}

const AUTH_KEY = "admin-auth";

export default function Admin() {
  const navigate = useNavigate();
  const [mainView, setMainView] = useState("catalog");
  const [tab, setTab] = useState("skin");

  const [skinItems, setSkinItems] = useState([]);
  const [laserItems, setLaserItems] = useState([]);
  const [productItems, setProductItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLocalFallback, setShowLocalFallback] = useState(false);
  const [writePolicyHint, setWritePolicyHint] = useState("");

  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingDash, setLoadingDash] = useState(true);
  const [dashLoadError, setDashLoadError] = useState("");
  const [showDashboardFallback, setShowDashboardFallback] = useState(false);
  const [bookingsRemote, setBookingsRemote] = useState(true);
  const [ordersRemote, setOrdersRemote] = useState(true);

  const syncBackupToLocalStorage = useCallback((skin, laser, products) => {
    try {
      localStorage.setItem("skin-items", JSON.stringify(skin));
      localStorage.setItem("laser-items", JSON.stringify(laser));
      localStorage.setItem("product-items", JSON.stringify(products));
    } catch {
      /* ignore */
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setWritePolicyHint("");

    let skin = [];
    let laser = [];
    let products = [];
    let usedFallback = false;

    const sRes = await fetchAllServices();
    if (sRes.error) {
      usedFallback = true;
      try {
        skin = JSON.parse(localStorage.getItem("skin-items")) || [];
        laser = JSON.parse(localStorage.getItem("laser-items")) || [];
        if (!Array.isArray(skin)) skin = [];
        if (!Array.isArray(laser)) laser = [];
      } catch {
        skin = [];
        laser = [];
      }
    } else {
      const rows = sRes.data || [];
      skin = rows
        .filter((r) => r.category === "skin")
        .map(rowToAdminServiceItem);
      laser = rows
        .filter((r) => r.category === "laser")
        .map(rowToAdminServiceItem);
    }

    const pRes = await fetchAllProducts();
    if (pRes.error) {
      usedFallback = true;
      try {
        products = JSON.parse(localStorage.getItem("product-items")) || [];
        if (!Array.isArray(products)) products = [];
      } catch {
        products = [];
      }
    } else {
      products = (pRes.data || []).map(rowToAdminProductItem);
    }

    setSkinItems(skin);
    setLaserItems(laser);
    setProductItems(products);
    setShowLocalFallback(usedFallback);
    setLoading(false);

    if (!usedFallback) {
      syncBackupToLocalStorage(skin, laser, products);
    }
  }, [syncBackupToLocalStorage]);

  const loadDashboard = useCallback(async () => {
    setLoadingDash(true);
    setDashLoadError("");
    setShowDashboardFallback(false);

    const [bRes, oRes] = await Promise.all([
      fetchBookings(),
      fetchOrdersWithItems(),
    ]);

    let fb = false;

    if (bRes.error) {
      fb = true;
      setBookingsRemote(false);
      setBookings(loadBookingsFromLs());
    } else {
      setBookingsRemote(true);
      const list = bRes.data ?? [];
      setBookings(list);
      try {
        localStorage.setItem(BOOKING_LS, JSON.stringify(list));
      } catch {
        /* ignore */
      }
    }

    if (oRes.error) {
      fb = true;
      setOrdersRemote(false);
      setOrders(loadOrdersFromLs());
    } else {
      setOrdersRemote(true);
      const list = oRes.data ?? [];
      setOrders(list);
      try {
        localStorage.setItem(ORDER_LS, JSON.stringify(list));
      } catch {
        /* ignore */
      }
    }

    if (bRes.error || oRes.error) {
      setShowDashboardFallback(true);
      const parts = [];
      if (bRes.error) parts.push("الحجوزات");
      if (oRes.error) parts.push("الطلبات");
      setDashLoadError(
        `تعذر تحميل ${parts.join(" و ")} من السيرفر. يتم عرض النسخ المحلية إن وُجدت.`
      );
    }

    setLoadingDash(false);
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_KEY);
    navigate("/admin-login", { replace: true });
  };

  const persistBookings = (next) => {
    try {
      localStorage.setItem(BOOKING_LS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const persistOrders = (next) => {
    try {
      localStorage.setItem(ORDER_LS, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const handleBookingStatus = async (id, status) => {
    setWritePolicyHint("");
    if (bookingsRemote) {
      const { data, error } = await updateBookingStatus(id, status);
      if (error) {
        if (isRlsOrWritePolicyError(error)) {
          setWritePolicyHint(
            "لا تسمح سياسات الأمان بالتحديث. شغّل supabase/admin_orders_policies_prototype.sql إن لزم."
          );
        } else {
          alert(`فشل التحديث: ${error.message}`);
        }
        return;
      }
      if (data) {
        const mapped = mapBookingRow(data);
        setBookings((prev) => {
          const next = prev.map((b) =>
            String(b.id) === String(id) ? mapped : b
          );
          persistBookings(next);
          return next;
        });
      }
    } else {
      setBookings((prev) => {
        const next = prev.map((b) =>
          String(b.id) === String(id) ? { ...b, status } : b
        );
        persistBookings(next);
        return next;
      });
    }
  };

  const handleOrderStatus = async (id, status) => {
    setWritePolicyHint("");
    if (ordersRemote) {
      const { data, error } = await updateOrderStatus(id, status);
      if (error) {
        if (isRlsOrWritePolicyError(error)) {
          setWritePolicyHint(
            "لا تسمح سياسات الأمان بالتحديث. شغّل supabase/admin_orders_policies_prototype.sql إن لزم."
          );
        } else {
          alert(`فشل التحديث: ${error.message}`);
        }
        return;
      }
      if (data) {
        setOrders((prev) => {
          const next = prev.map((o) =>
            String(o.id) === String(id) ? { ...o, status: data.status } : o
          );
          persistOrders(next);
          return next;
        });
      }
    } else {
      setOrders((prev) => {
        const next = prev.map((o) =>
          String(o.id) === String(id) ? { ...o, status } : o
        );
        persistOrders(next);
        return next;
      });
    }
  };

  const itemsForTab =
    tab === "skin"
      ? skinItems
      : tab === "laser"
        ? laserItems
        : productItems;

  return (
    <div style={styles.page} dir="rtl">
      <div style={styles.titleRow}>
        <h1 style={styles.title}>لوحة التحكم – Maye Clinic</h1>
        <button
          type="button"
          style={styles.logoutBtn}
          onClick={handleLogout}
        >
          تسجيل الخروج
        </button>
      </div>

      {showLocalFallback && (
        <div style={styles.warnBanner} role="status">
          يتم عرض بيانات الكتالوج من التخزين المحلي فقط لأن الاتصال بقاعدة البيانات
          فشل أو غير متاح.
        </div>
      )}

      {showDashboardFallback && (
        <div style={styles.warnBanner} role="status">
          يتم عرض حجوزات الجلسات و/أو طلبات المتجر من النسخ المحلية (إن وُجدت)
          لأن التحميل من السيرفر تعذر. {dashLoadError && ` ${dashLoadError}`}
        </div>
      )}

      {writePolicyHint && (
        <div style={styles.errorBanner} role="alert">
          {writePolicyHint}
        </div>
      )}

      <div style={styles.mainTabs}>
        <button
          type="button"
          style={{
            ...styles.mainTab,
            background: mainView === "catalog" ? "#c9a24d" : "#fff",
            color: mainView === "catalog" ? "#fff" : "#2e241d",
          }}
          onClick={() => setMainView("catalog")}
        >
          إدارة الكتالوج
        </button>
        <button
          type="button"
          style={{
            ...styles.mainTab,
            background: mainView === "bookings" ? "#c9a24d" : "#fff",
            color: mainView === "bookings" ? "#fff" : "#2e241d",
          }}
          onClick={() => setMainView("bookings")}
        >
          حجوزات الجلسات
        </button>
        <button
          type="button"
          style={{
            ...styles.mainTab,
            background: mainView === "orders" ? "#c9a24d" : "#fff",
            color: mainView === "orders" ? "#fff" : "#2e241d",
          }}
          onClick={() => setMainView("orders")}
        >
          طلبات المتجر
        </button>
      </div>

      {mainView === "catalog" && (
        <>
          <div style={styles.tabs}>
            <Tab
              label="جلسات البشرة"
              active={tab === "skin"}
              onClick={() => setTab("skin")}
            />
            <Tab
              label="جلسات الليزر"
              active={tab === "laser"}
              onClick={() => setTab("laser")}
            />
            <Tab
              label="المنتجات"
              active={tab === "products"}
              onClick={() => setTab("products")}
            />
          </div>

          {loading ? (
            <p style={styles.loading}>جاري تحميل البيانات…</p>
          ) : (
            <AdminSection
              tabType={tab === "products" ? "products" : "services"}
              serviceCategory={
                tab === "skin" ? "skin" : tab === "laser" ? "laser" : "skin"
              }
              items={itemsForTab}
              onReload={loadCatalog}
              onRlsHint={setWritePolicyHint}
            />
          )}
        </>
      )}

      {mainView === "bookings" && (
        <BookingsPanel
          loading={loadingDash}
          bookings={bookings}
          onStatusChange={handleBookingStatus}
        />
      )}

      {mainView === "orders" && (
        <OrdersPanel
          loading={loadingDash}
          orders={orders}
          onStatusChange={handleOrderStatus}
        />
      )}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...styles.tab,
        background: active ? "#c9a24d" : "#fff",
        color: active ? "#fff" : "#2e241d",
      }}
    >
      {label}
    </button>
  );
}

function BookingsPanel({ loading, bookings, onStatusChange }) {
  if (loading) {
    return <p style={styles.loading}>جاري تحميل الحجوزات…</p>;
  }

  if (bookings.length === 0) {
    return (
      <div style={styles.dashboardCard}>
        <h2 style={styles.sectionTitle}>حجوزات الجلسات</h2>
        <p style={styles.muted}>لا توجد حجوزات لعرضها.</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardCard}>
      <h2 style={styles.sectionTitle}>حجوزات الجلسات</h2>
      <div style={styles.tableScroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>الاسم</th>
              <th style={styles.th}>الهاتف</th>
              <th style={styles.th}>الخدمة</th>
              <th style={styles.th}>النوع</th>
              <th style={styles.th}>التاريخ</th>
              <th style={styles.th}>الوقت</th>
              <th style={styles.th}>ملاحظات</th>
              <th style={styles.th}>الحالة</th>
              <th style={styles.th}>أُنشئت</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={String(b.id)}>
                <td style={styles.td}>{b.fullName}</td>
                <td style={styles.td}>{b.phone}</td>
                <td style={styles.td}>{b.serviceName}</td>
                <td style={styles.td}>{b.serviceType}</td>
                <td style={styles.td}>{b.date ?? "—"}</td>
                <td style={styles.td}>{b.time ?? "—"}</td>
                <td style={styles.tdSmall}>{b.notes || "—"}</td>
                <td style={styles.td}>
                  <select
                    value={b.status}
                    onChange={(e) =>
                      onStatusChange(b.id, e.target.value)
                    }
                    style={styles.statusSelect}
                    aria-label="حالة الحجز"
                  >
                    {[
                      ...new Set([...BOOKING_STATUS_OPTIONS, b.status].filter(Boolean)),
                    ].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td style={styles.tdSmall}>{formatDt(b.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OrdersPanel({ loading, orders, onStatusChange }) {
  if (loading) {
    return <p style={styles.loading}>جاري تحميل الطلبات…</p>;
  }

  if (orders.length === 0) {
    return (
      <div style={styles.dashboardCard}>
        <h2 style={styles.sectionTitle}>طلبات المتجر</h2>
        <p style={styles.muted}>لا توجد طلبات لعرضها.</p>
      </div>
    );
  }

  return (
    <div style={styles.dashboardStack}>
      {orders.map((order) => (
        <div key={String(order.id)} style={styles.orderBlock}>
          <div style={styles.orderHeader}>
            <strong>طلب #{String(order.id).slice(0, 8)}…</strong>
            <span style={styles.muted}>{formatDt(order.createdAt)}</span>
          </div>
          <div style={styles.orderGrid}>
            <div>
              <span style={styles.label}>الاسم:</span>{" "}
              {order.customer?.fullName}
            </div>
            <div>
              <span style={styles.label}>الهاتف:</span>{" "}
              {order.customer?.phone}
            </div>
            <div>
              <span style={styles.label}>المدينة:</span>{" "}
              {order.customer?.city}
            </div>
            <div>
              <span style={styles.label}>العنوان:</span>{" "}
              {order.customer?.address}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={styles.label}>ملاحظات:</span>{" "}
              {order.customer?.notes || "—"}
            </div>
            <div>
              <span style={styles.label}>الإجمالي:</span> {order.total} ₪
            </div>
            <div>
              <span style={styles.label}>الحالة:</span>{" "}
              <select
                value={order.status}
                onChange={(e) =>
                  onStatusChange(order.id, e.target.value)
                }
                style={styles.statusSelect}
                aria-label="حالة الطلب"
              >
                {[
                  ...new Set([...ORDER_STATUS_OPTIONS, order.status].filter(Boolean)),
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={styles.tableScroll}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>المنتج</th>
                  <th style={styles.th}>النوع</th>
                  <th style={styles.th}>السعر</th>
                  <th style={styles.th}>الكمية</th>
                  <th style={styles.th}>المجموع</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it, idx) => (
                  <tr key={it.id ?? idx}>
                    <td style={styles.td}>{it.name}</td>
                    <td style={styles.td}>
                      {it.item_type ?? it.type ?? "—"}
                    </td>
                    <td style={styles.td}>{it.price} ₪</td>
                    <td style={styles.td}>{it.quantity}</td>
                    <td style={styles.td}>
                      {it.line_subtotal ?? it.lineSubtotal} ₪
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminSection({ tabType, serviceCategory, items, onReload, onRlsHint }) {
  const isProduct = tabType === "products";

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [images, setImages] = useState([]);

  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({
    name: "",
    price: "",
    desc: "",
    images: [],
  });

  const handleImages = (files, cb) => {
    const imgs = [];
    [...files].forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        imgs.push(reader.result);
        if (imgs.length === files.length) cb(imgs);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMutationError = (error) => {
    if (isRlsOrWritePolicyError(error)) {
      onRlsHint(
        "لا تسمح سياسات الأمان (RLS) حالياً بالكتابة على الجدول. شغّل ملف supabase/admin_catalog_policies.sql في محرر SQL أو فعّل سياسات مناسبة لاحقاً."
      );
    } else {
      alert(`فشلت العملية: ${error?.message || "خطأ غير معروف"}`);
    }
  };

  const addItem = async () => {
    if (!name || !price || !desc || images.length < 1) {
      alert("الرجاء إدخال الاسم والسعر والوصف وصورة واحدة على الأقل");
      return;
    }

    const imageUrl = images[0];
    onRlsHint("");

    if (isProduct) {
      const { error } = await createProduct({
        name,
        description: desc,
        price,
        image_url: imageUrl,
      });
      if (error) {
        handleMutationError(error);
        return;
      }
    } else {
      const { error } = await createService({
        name,
        description: desc,
        price,
        category: serviceCategory,
        image_url: imageUrl,
      });
      if (error) {
        handleMutationError(error);
        return;
      }
    }

    setName("");
    setPrice("");
    setDesc("");
    setImages([]);
    await onReload();
  };

  const removeItem = async (id) => {
    onRlsHint("");
    if (isProduct) {
      const { error } = await deleteProduct(id);
      if (error) {
        handleMutationError(error);
        return;
      }
    } else {
      const { error } = await deleteService(id);
      if (error) {
        handleMutationError(error);
        return;
      }
    }
    await onReload();
  };

  const startEdit = (item) => {
    setEditId(item.id);
    setEditData({
      name: item.name,
      price: String(item.price),
      desc: item.desc,
      images: item.images?.length ? [...item.images] : [],
    });
  };

  const saveEdit = async () => {
    if (editData.images.length < 1) {
      alert("يجب وجود صورة واحدة على الأقل");
      return;
    }

    onRlsHint("");
    const imageUrl = editData.images[0];

    if (isProduct) {
      const { error } = await updateProduct(editId, {
        name: editData.name,
        description: editData.desc,
        price: editData.price,
        image_url: imageUrl,
      });
      if (error) {
        handleMutationError(error);
        return;
      }
    } else {
      const { error } = await updateService(editId, {
        name: editData.name,
        description: editData.desc,
        price: editData.price,
        category: serviceCategory,
        image_url: imageUrl,
      });
      if (error) {
        handleMutationError(error);
        return;
      }
    }

    setEditId(null);
    await onReload();
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.sectionTitle}>إدارة العناصر</h2>

      <div style={styles.form}>
        <input
          style={styles.input}
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <textarea
          style={styles.textarea}
          placeholder="الوصف"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleImages(e.target.files, setImages)}
        />

        <button type="button" style={styles.addBtn} onClick={addItem}>
          إضافة
        </button>
      </div>

      {items.map((item) => (
        <div key={String(item.id)} style={styles.row}>
          {editId === item.id ? (
            <>
              <input
                style={styles.input}
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
              <input
                style={styles.input}
                value={editData.price}
                onChange={(e) =>
                  setEditData({ ...editData, price: e.target.value })
                }
              />
              <textarea
                style={styles.textarea}
                value={editData.desc}
                onChange={(e) =>
                  setEditData({ ...editData, desc: e.target.value })
                }
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) =>
                  handleImages(e.target.files, (imgs) =>
                    setEditData({ ...editData, images: imgs })
                  )
                }
              />
              <button
                type="button"
                style={styles.saveBtn}
                onClick={saveEdit}
              >
                حفظ
              </button>
            </>
          ) : (
            <>
              <div style={styles.imagesRow}>
                {(item.images || []).slice(0, 3).map((img, i) => (
                  <img key={i} src={img} alt="" style={styles.thumb} />
                ))}
              </div>
              <div>
                <strong>{item.name}</strong>
                {!item.is_active && (
                  <span style={styles.inactiveBadge}> (معطّل)</span>
                )}
                <div>{item.price} ₪</div>
                <p style={styles.descText}>{item.desc}</p>
              </div>
              <div>
                <button
                  type="button"
                  style={styles.editBtn}
                  onClick={() => startEdit(item)}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  style={styles.deleteBtn}
                  onClick={() => removeItem(item.id)}
                >
                  حذف
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================= STYLES ================= */

const styles = {
  page: { maxWidth: 1100, margin: "40px auto", padding: 20 },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  title: { margin: 0, color: "#2e241d", flex: "1 1 auto" },
  logoutBtn: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid rgba(46, 36, 29, 0.2)",
    background: "#fff",
    color: "#2e241d",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 14,
  },
  warnBanner: {
    background: "#fff8e6",
    border: "1px solid #f0d78c",
    color: "#7a5c00",
    padding: "12px 14px",
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 1.6,
  },
  errorBanner: {
    background: "#fdecea",
    border: "1px solid #f5c6cb",
    color: "#721c24",
    padding: "12px 14px",
    borderRadius: 10,
    marginBottom: 16,
    lineHeight: 1.6,
  },
  loading: { color: "#6b5a4c", marginTop: 12 },
  mainTabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  mainTab: {
    padding: "10px 18px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    cursor: "pointer",
    fontWeight: 700,
    fontSize: 15,
  },
  tabs: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" },
  tab: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.15)",
    cursor: "pointer",
    fontWeight: 700,
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },
  dashboardCard: {
    background: "#fff",
    padding: 20,
    borderRadius: 18,
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
    marginBottom: 16,
  },
  dashboardStack: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  orderBlock: {
    background: "#fff",
    padding: 16,
    borderRadius: 16,
    border: "1px solid rgba(201, 162, 77, 0.25)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  orderGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 10,
    marginBottom: 12,
    fontSize: 14,
    color: "#2e241d",
  },
  label: { color: "#7a6a5c", fontWeight: 600 },
  muted: { color: "#6b5a4c", fontSize: 14 },
  sectionTitle: { marginBottom: 16 },
  form: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 10,
    marginBottom: 20,
  },
  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.2)",
  },
  textarea: {
    gridColumn: "1 / -1",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.2)",
    minHeight: 70,
  },
  addBtn: {
    gridColumn: "1 / -1",
    background: "#c9a24d",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px",
    cursor: "pointer",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 2fr auto",
    gap: 12,
    padding: "14px 0",
    borderBottom: "1px solid rgba(0,0,0,0.08)",
  },
  imagesRow: { display: "flex", gap: 6 },
  thumb: { width: 55, height: 55, borderRadius: 8, objectFit: "cover" },
  descText: { fontSize: 13, color: "#6b5a4c" },
  inactiveBadge: { color: "#999", fontSize: 13 },
  editBtn: {
    marginRight: 6,
    background: "#eee",
    border: "none",
    padding: "6px 10px",
    borderRadius: 6,
    cursor: "pointer",
  },
  deleteBtn: {
    background: "transparent",
    border: "none",
    color: "#b33",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#4caf50",
    color: "#fff",
    border: "none",
    padding: "8px 12px",
    borderRadius: 6,
    cursor: "pointer",
  },
  tableScroll: { overflowX: "auto", WebkitOverflowScrolling: "touch" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
    minWidth: 720,
  },
  th: {
    textAlign: "right",
    padding: "10px 8px",
    borderBottom: "2px solid rgba(201, 162, 77, 0.35)",
    color: "#2e241d",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    verticalAlign: "top",
  },
  tdSmall: {
    padding: "10px 8px",
    borderBottom: "1px solid rgba(0,0,0,0.06)",
    maxWidth: 140,
    wordBreak: "break-word",
    fontSize: 12,
  },
  statusSelect: {
    padding: "6px 8px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.2)",
    minWidth: 100,
    fontSize: 13,
  },
};
