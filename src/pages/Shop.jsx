import { useEffect, useState } from "react";
import { getProducts } from "../lib/catalogApi.js";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFetchError, setShowFetchError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setShowFetchError(false);

      const { data, error } = await getProducts();

      let nextProducts = [];

      if (!error && data?.length) {
        nextProducts = data;
      } else {
        try {
          nextProducts = JSON.parse(localStorage.getItem("product-items")) || [];
          if (!Array.isArray(nextProducts)) nextProducts = [];
        } catch {
          nextProducts = [];
        }
      }

      if (cancelled) return;

      setProducts(nextProducts);
      setShowFetchError(!!error && nextProducts.length === 0);
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
      type: "product",
    });

    localStorage.setItem("cart-items", JSON.stringify(cart));
    alert("تمت إضافة المنتج إلى السلة 🛒");
  };

  return (
    <div style={page} dir="rtl">
      <h1>المتجر</h1>

      {loading && (
        <p style={loadingText} role="status">
          جاري تحميل المنتجات…
        </p>
      )}

      {showFetchError && (
        <div style={errorBanner} role="alert">
          تعذر تحميل المنتجات من السيرفر، ولا توجد بيانات محفوظة محلياً. تحقق من
          الاتصال أو أضيفي المنتجات من لوحة التحكم.
        </div>
      )}

      {!loading && (
        <div style={grid}>
          {products.length === 0 && !showFetchError && (
            <p style={emptyHint}>لا توجد منتجات متاحة حالياً.</p>
          )}

          {products.map((product) => (
            <div key={product.id} style={card}>
              <img src={product.images[0]} alt="" style={img} />

              <h3>{product.name}</h3>
              <p style={desc}>{product.desc}</p>
              <strong>{product.price} ₪</strong>

              <button
                style={viewBtn}
                onClick={() => setGallery(product.images)}
              >
                عرض الصور
              </button>

              <button
                style={cartBtn}
                onClick={() => addToCart(product)}
              >
                أضف إلى السلة
              </button>
            </div>
          ))}
        </div>
      )}

      {gallery && (
        <ImageModal images={gallery} onClose={() => setGallery(null)} />
      )}
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
  gridColumn: "1 / -1",
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
  height: 200,
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
