import { useEffect, useState } from "react";
import { getProducts } from "../lib/catalogApi.js";
import { useLanguage } from "../i18n/LanguageContext";

export default function Shop() {
  const { t } = useLanguage();
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
    alert(t("shop.addedToCart"));
  };

  return (
    <div className="mc-page">
      <h1 className="mc-page-title">{t("shop.pageTitle")}</h1>

      {loading && (
        <p className="mc-loading mc-loading--inline" role="status">
          {t("common.loadingProducts")}
        </p>
      )}

      {showFetchError && (
        <div className="mc-alert mc-alert--error" role="alert">
          {t("shop.fetchError")}
        </div>
      )}

      {!loading && (
        <div className="mc-catalog-grid">
          {products.length === 0 && !showFetchError && (
            <p className="mc-muted" style={{ gridColumn: "1 / -1" }}>
              {t("shop.empty")}
            </p>
          )}

          {products.map((product) => (
            <article key={product.id} className="mc-catalog-card">
              <div className="mc-catalog-img-wrap">
                <img
                  src={product.images[0]}
                  alt=""
                  className="mc-catalog-img"
                />
              </div>

              <h3>{product.name}</h3>
              <p className="mc-catalog-desc">{product.desc}</p>
              <p className="mc-catalog-price">{product.price} ₪</p>

              <div className="mc-catalog-actions">
                <button
                  type="button"
                  className="mc-btn mc-btn-primary mc-btn-block"
                  onClick={() => setGallery(product.images)}
                >
                  {t("common.viewImages")}
                </button>

                <button
                  type="button"
                  className="mc-btn mc-btn-outline mc-btn-block"
                  onClick={() => addToCart(product)}
                >
                  {t("common.addToCart")}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {gallery && (
        <ImageModal images={gallery} onClose={() => setGallery(null)} t={t} />
      )}
    </div>
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
