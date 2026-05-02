import { useEffect, useState } from "react";
import { getServices } from "../lib/catalogApi.js";

export default function Services() {
  const [skin, setSkin] = useState([]);
  const [laser, setLaser] = useState([]);
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFetchError, setShowFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setShowFetchError(false);

      const { data, error } = await getServices();

      let nextSkin = [];
      let nextLaser = [];

      if (!error && data?.length) {
        nextSkin = data.filter((s) => s.category === "skin");
        nextLaser = data.filter((s) => s.category === "laser");
      }

      const useFullLocalFallback = error || !data?.length;

      if (useFullLocalFallback) {
        try {
          const lsSkin = JSON.parse(localStorage.getItem("skin-items")) || [];
          const lsLaser = JSON.parse(localStorage.getItem("laser-items")) || [];
          nextSkin = Array.isArray(lsSkin) ? lsSkin : [];
          nextLaser = Array.isArray(lsLaser) ? lsLaser : [];
        } catch {
          nextSkin = [];
          nextLaser = [];
        }
      } else {
        if (nextSkin.length === 0) {
          try {
            const ls = JSON.parse(localStorage.getItem("skin-items")) || [];
            if (Array.isArray(ls) && ls.length) nextSkin = ls;
          } catch {
            /* ignore */
          }
        }
        if (nextLaser.length === 0) {
          try {
            const ls = JSON.parse(localStorage.getItem("laser-items")) || [];
            if (Array.isArray(ls) && ls.length) nextLaser = ls;
          } catch {
            /* ignore */
          }
        }
      }

      if (cancelled) return;

      setSkin(nextSkin);
      setLaser(nextLaser);
      setShowFetchError(
        !!error && nextSkin.length === 0 && nextLaser.length === 0
      );
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const addToCart = (item) => {
    const cart = JSON.parse(localStorage.getItem("cart-items")) || [];

    cart.push({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.images[0],
      type: "service",
    });

    localStorage.setItem("cart-items", JSON.stringify(cart));
    alert("تمت الإضافة إلى السلة 🛒");
  };

  return (
    <div style={page} dir="rtl">
      <h1>الخدمات</h1>

      {loading && (
        <p style={loadingText} role="status">
          جاري تحميل الخدمات…
        </p>
      )}

      {showFetchError && (
        <div style={errorBanner} role="alert">
          تعذر تحميل الخدمات من السيرفر، ولا توجد بيانات محفوظة محلياً. تحقق من
          الاتصال أو أضيفي الخدمات من لوحة التحكم.
        </div>
      )}

      {!loading && (
        <>
          <Section
            title="جلسات العناية بالبشرة"
            items={skin}
            onView={setGallery}
            onAdd={addToCart}
          />

          <Section
            title="جلسات الليزر"
            items={laser}
            onView={setGallery}
            onAdd={addToCart}
          />
        </>
      )}

      {gallery && (
        <ImageModal images={gallery} onClose={() => setGallery(null)} />
      )}
    </div>
  );
}

/* ================= SECTIONS ================= */

function Section({ title, items, onView, onAdd }) {
  return (
    <div style={{ marginTop: 40 }}>
      <h2>{title}</h2>

      {items.length === 0 && (
        <p style={emptyHint}>لا توجد عناصر في هذا القسم حالياً.</p>
      )}

      <div style={grid}>
        {items.map((item) => (
          <div key={item.id} style={card}>
            <img src={item.images[0]} alt="" style={img} />

            <h3>{item.name}</h3>
            <p style={desc}>{item.desc}</p>
            <strong>{item.price} ₪</strong>

            <button style={viewBtn} onClick={() => onView(item.images)}>
              عرض الصور
            </button>

            <button style={cartBtn} onClick={() => onAdd(item)}>
              أضف إلى السلة
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= MODAL ================= */

function ImageModal({ images, onClose }) {
  const [index, setIndex] = useState(0);

  return (
    <div style={overlay}>
      <div style={modal}>
        <button style={closeBtn} onClick={onClose}>
          ✕
        </button>

        <img src={images[index]} alt="" style={modalImg} />

        <div style={nav}>
          <button
            onClick={() =>
              setIndex((index - 1 + images.length) % images.length)
            }
          >
            ‹
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button onClick={() => setIndex((index + 1) % images.length)}>
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  maxWidth: 1100,
  margin: "40px auto",
  padding: 20,
};

const loadingText = {
  color: "#6b5a4c",
  fontSize: 16,
  marginTop: 16,
};

const errorBanner = {
  background: "#fdecea",
  border: "1px solid #f5c6cb",
  color: "#721c24",
  padding: "14px 16px",
  borderRadius: 12,
  marginTop: 16,
  lineHeight: 1.6,
};

const emptyHint = {
  color: "#9c8b7a",
  fontSize: 14,
  marginBottom: 12,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill,minmax(250px,1fr))",
  gap: 20,
};

const card = {
  background: "#fff",
  padding: 16,
  borderRadius: 16,
  boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
};

const img = {
  width: "100%",
  height: 180,
  objectFit: "cover",
  borderRadius: 12,
  marginBottom: 10,
};

const desc = {
  color: "#6b5a4c",
  fontSize: 14,
  margin: "8px 0",
};

const viewBtn = {
  marginTop: 8,
  width: "100%",
  padding: "8px",
  borderRadius: 8,
  border: "none",
  background: "#c9a24d",
  color: "#fff",
  cursor: "pointer",
};

const cartBtn = {
  marginTop: 8,
  width: "100%",
  padding: "8px",
  borderRadius: 8,
  border: "1px solid #c9a24d",
  background: "#fff",
  color: "#c9a24d",
  cursor: "pointer",
};

/* Modal */

const overlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modal = {
  background: "#fff",
  padding: 20,
  borderRadius: 16,
  maxWidth: 600,
  width: "90%",
  position: "relative",
};

const modalImg = {
  width: "100%",
  maxHeight: 400,
  objectFit: "contain",
};

const closeBtn = {
  position: "absolute",
  top: 10,
  right: 10,
  border: "none",
  background: "transparent",
  fontSize: 20,
  cursor: "pointer",
};

const nav = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
};
