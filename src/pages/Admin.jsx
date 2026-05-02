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
import "./admin.css";

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
    <div className="admin-page" dir="rtl">
      <div className="admin-title-row">
        <h1 className="admin-title">لوحة التحكم – Maye Clinic</h1>
        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleLogout}
        >
          تسجيل الخروج
        </button>
      </div>

      {showLocalFallback && (
        <div className="admin-warn-banner" role="status">
          يتم عرض بيانات الكتالوج من التخزين المحلي فقط لأن الاتصال بقاعدة البيانات
          فشل أو غير متاح.
        </div>
      )}

      {showDashboardFallback && (
        <div className="admin-warn-banner" role="status">
          يتم عرض حجوزات الجلسات و/أو طلبات المتجر من النسخ المحلية (إن وُجدت)
          لأن التحميل من السيرفر تعذر. {dashLoadError && ` ${dashLoadError}`}
        </div>
      )}

      {writePolicyHint && (
        <div className="admin-error-banner" role="alert">
          {writePolicyHint}
        </div>
      )}

      <div className="admin-main-tabs" role="tablist" aria-label="أقسام لوحة التحكم">
        <button
          type="button"
          role="tab"
          aria-selected={mainView === "catalog"}
          className={
            "admin-main-tab" + (mainView === "catalog" ? " is-active" : "")
          }
          onClick={() => setMainView("catalog")}
        >
          إدارة الكتالوج
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainView === "bookings"}
          className={
            "admin-main-tab" + (mainView === "bookings" ? " is-active" : "")
          }
          onClick={() => setMainView("bookings")}
        >
          حجوزات الجلسات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainView === "orders"}
          className={
            "admin-main-tab" + (mainView === "orders" ? " is-active" : "")
          }
          onClick={() => setMainView("orders")}
        >
          طلبات المتجر
        </button>
      </div>

      {mainView === "catalog" && (
        <>
          <div className="admin-sub-tabs">
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
            <p className="admin-loading">جاري تحميل البيانات…</p>
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
      className={"admin-sub-tab" + (active ? " is-active" : "")}
    >
      {label}
    </button>
  );
}

function BookingsPanel({ loading, bookings, onStatusChange }) {
  if (loading) {
    return <p className="admin-loading">جاري تحميل الحجوزات…</p>;
  }

  if (bookings.length === 0) {
    return (
      <div className="admin-panel">
        <h2 className="admin-section-title">حجوزات الجلسات</h2>
        <p className="admin-muted">لا توجد حجوزات لعرضها.</p>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h2 className="admin-section-title">حجوزات الجلسات</h2>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-th">الاسم</th>
              <th className="admin-th">الهاتف</th>
              <th className="admin-th">الخدمة</th>
              <th className="admin-th">النوع</th>
              <th className="admin-th">التاريخ</th>
              <th className="admin-th">الوقت</th>
              <th className="admin-th">ملاحظات</th>
              <th className="admin-th">الحالة</th>
              <th className="admin-th">أُنشئت</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={String(b.id)}>
                <td className="admin-td">{b.fullName}</td>
                <td className="admin-td">{b.phone}</td>
                <td className="admin-td">{b.serviceName}</td>
                <td className="admin-td">{b.serviceType}</td>
                <td className="admin-td">{b.date ?? "—"}</td>
                <td className="admin-td">{b.time ?? "—"}</td>
                <td className="admin-td-small">{b.notes || "—"}</td>
                <td className="admin-td">
                  <select
                    value={b.status}
                    onChange={(e) =>
                      onStatusChange(b.id, e.target.value)
                    }
                    className="admin-status-select"
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
                <td className="admin-td-small">{formatDt(b.createdAt)}</td>
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
    return <p className="admin-loading">جاري تحميل الطلبات…</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="admin-panel">
        <h2 className="admin-section-title">طلبات المتجر</h2>
        <p className="admin-muted">لا توجد طلبات لعرضها.</p>
      </div>
    );
  }

  return (
    <div className="admin-orders-stack">
      {orders.map((order) => (
        <div key={String(order.id)} className="admin-order-card">
          <div className="admin-order-head">
            <strong>طلب #{String(order.id).slice(0, 8)}…</strong>
            <span className="admin-muted">{formatDt(order.createdAt)}</span>
          </div>
          <div className="admin-order-grid">
            <div>
              <span className="admin-kv-label">الاسم:</span>{" "}
              {order.customer?.fullName}
            </div>
            <div>
              <span className="admin-kv-label">الهاتف:</span>{" "}
              {order.customer?.phone}
            </div>
            <div>
              <span className="admin-kv-label">المدينة:</span>{" "}
              {order.customer?.city}
            </div>
            <div>
              <span className="admin-kv-label">العنوان:</span>{" "}
              {order.customer?.address}
            </div>
            <div className="admin-order-grid-full">
              <span className="admin-kv-label">ملاحظات:</span>{" "}
              {order.customer?.notes || "—"}
            </div>
            <div>
              <span className="admin-kv-label">الإجمالي:</span> {order.total} ₪
            </div>
            <div>
              <span className="admin-kv-label">الحالة:</span>{" "}
              <select
                value={order.status}
                onChange={(e) =>
                  onStatusChange(order.id, e.target.value)
                }
                className="admin-status-select"
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
          <div className="admin-table-scroll">
            <table className="admin-table">
              <thead>
                <tr>
                  <th className="admin-th">المنتج</th>
                  <th className="admin-th">النوع</th>
                  <th className="admin-th">السعر</th>
                  <th className="admin-th">الكمية</th>
                  <th className="admin-th">المجموع</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((it, idx) => (
                  <tr key={it.id ?? idx}>
                    <td className="admin-td">{it.name}</td>
                    <td className="admin-td">
                      {it.item_type ?? it.type ?? "—"}
                    </td>
                    <td className="admin-td">{it.price} ₪</td>
                    <td className="admin-td">{it.quantity}</td>
                    <td className="admin-td">
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
    <div className="admin-editor-card">
      <h2 className="admin-section-title">إدارة العناصر</h2>

      <div className="admin-add-form">
        <input
          className="admin-input"
          placeholder="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="admin-input"
          placeholder="السعر"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />

        <textarea
          className="admin-textarea"
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

        <button type="button" className="admin-btn-add" onClick={addItem}>
          إضافة
        </button>
      </div>

      {items.map((item) => (
        <div key={String(item.id)} className="admin-item-row">
          {editId === item.id ? (
            <>
              <input
                className="admin-input"
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
              <input
                className="admin-input"
                value={editData.price}
                onChange={(e) =>
                  setEditData({ ...editData, price: e.target.value })
                }
              />
              <textarea
                className="admin-textarea"
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
                className="admin-btn-save"
                onClick={saveEdit}
              >
                حفظ
              </button>
            </>
          ) : (
            <>
              <div className="admin-thumbs">
                {(item.images || []).slice(0, 3).map((img, i) => (
                  <img key={i} src={img} alt="" className="admin-thumb" />
                ))}
              </div>
              <div>
                <strong>{item.name}</strong>
                {!item.is_active && (
                  <span className="admin-inactive"> (معطّل)</span>
                )}
                <div>{item.price} ₪</div>
                <p className="admin-desc">{item.desc}</p>
              </div>
              <div>
                <button
                  type="button"
                  className="admin-btn-edit"
                  onClick={() => startEdit(item)}
                >
                  تعديل
                </button>
                <button
                  type="button"
                  className="admin-btn-delete"
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

