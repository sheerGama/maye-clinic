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
    <div className="mc-page" dir="rtl">
      <h1 className="mc-page-title">الخدمات</h1>

      {loading && (
        <p className="mc-loading mc-loading--inline" role="status">
          جاري تحميل الخدمات…
        </p>
      )}

      {showFetchError && (
        <div className="mc-alert mc-alert--error" role="alert">
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

function Section({ title, items, onView, onAdd }) {
  return (
    <section>
      <h2 className="mc-section-heading">{title}</h2>

      {items.length === 0 && (
        <p className="mc-muted" style={{ marginBottom: 16 }}>
          لا توجد عناصر في هذا القسم حالياً.
        </p>
      )}

      <div className="mc-catalog-grid">
        {items.map((item) => (
          <article key={item.id} className="mc-catalog-card">
            <div className="mc-catalog-img-wrap">
              <img
                src={item.images[0]}
                alt=""
                className="mc-catalog-img"
              />
            </div>

            <h3>{item.name}</h3>
            <p className="mc-catalog-desc">{item.desc}</p>
            <p className="mc-catalog-price">{item.price} ₪</p>

            <div className="mc-catalog-actions">
              <button
                type="button"
                className="mc-btn mc-btn-primary mc-btn-block"
                onClick={() => onView(item.images)}
              >
                عرض الصور
              </button>

              <button
                type="button"
                className="mc-btn mc-btn-outline mc-btn-block"
                onClick={() => onAdd(item)}
              >
                أضف إلى السلة
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImageModal({ images, onClose }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="mc-modal-overlay" role="presentation">
      <div className="mc-modal" role="dialog" aria-modal="true" aria-label="معرض الصور">
        <button
          type="button"
          className="mc-modal-close"
          onClick={onClose}
          aria-label="إغلاق"
        >
          ✕
        </button>

        <img src={images[index]} alt="" className="mc-modal-img" />

        <div className="mc-modal-nav">
          <button
            type="button"
            onClick={() =>
              setIndex((index - 1 + images.length) % images.length)
            }
            aria-label="الصورة السابقة"
          >
            ‹
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((index + 1) % images.length)}
            aria-label="الصورة التالية"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
