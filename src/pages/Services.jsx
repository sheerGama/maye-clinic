import { useEffect, useState } from "react";
import { getServices } from "../lib/catalogApi.js";
import { useLanguage } from "../i18n/LanguageContext";

export default function Services() {
  const { t } = useLanguage();
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
    alert(t("services.addedToCart"));
  };

  return (
    <div className="mc-page">
      <h1 className="mc-page-title">{t("services.pageTitle")}</h1>

      {loading && (
        <p className="mc-loading mc-loading--inline" role="status">
          {t("common.loadingServices")}
        </p>
      )}

      {showFetchError && (
        <div className="mc-alert mc-alert--error" role="alert">
          {t("services.fetchError")}
        </div>
      )}

      {!loading && (
        <>
          <Section
            title={t("services.skinSection")}
            items={skin}
            onView={setGallery}
            onAdd={addToCart}
            t={t}
          />

          <Section
            title={t("services.laserSection")}
            items={laser}
            onView={setGallery}
            onAdd={addToCart}
            t={t}
          />
        </>
      )}

      {gallery && (
        <ImageModal images={gallery} onClose={() => setGallery(null)} t={t} />
      )}
    </div>
  );
}

function Section({ title, items, onView, onAdd, t }) {
  return (
    <section>
      <h2 className="mc-section-heading">{title}</h2>

      {items.length === 0 && (
        <p className="mc-muted" style={{ marginBottom: 16 }}>
          {t("services.sectionEmpty")}
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
                {t("common.viewImages")}
              </button>

              <button
                type="button"
                className="mc-btn mc-btn-outline mc-btn-block"
                onClick={() => onAdd(item)}
              >
                {t("common.addToCart")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ImageModal({ images, onClose, t }) {
  const [index, setIndex] = useState(0);

  return (
    <div className="mc-modal-overlay" role="presentation">
      <div
        className="mc-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t("common.imageGallery")}
      >
        <button
          type="button"
          className="mc-modal-close"
          onClick={onClose}
          aria-label={t("common.close")}
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
            aria-label={t("common.previousImage")}
          >
            ‹
          </button>
          <span>
            {index + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={() => setIndex((index + 1) % images.length)}
            aria-label={t("common.nextImage")}
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
