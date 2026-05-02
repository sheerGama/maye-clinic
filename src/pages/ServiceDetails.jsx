import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getServices, PLACEHOLDER_IMAGE } from "../lib/catalogApi.js";
import "./detailPages.css";

const STORAGE_SKIN = "skin-items";
const STORAGE_LASER = "laser-items";

/**
 * Normalize a service object from Supabase or localStorage backup.
 * Ensures id, name, desc, price, images[], image, category.
 */
function normalizeServiceItem(raw, categoryDefault) {
  if (!raw || typeof raw !== "object") return null;
  const id = raw.id;
  if (id === undefined || id === null || id === "") return null;

  const name = String(raw.name ?? "");
  const desc = String(raw.desc ?? raw.description ?? "");
  const price = Number(raw.price);
  const priceOk = Number.isFinite(price) ? price : 0;
  const category = String(raw.category ?? categoryDefault ?? "");

  let images = [];
  if (Array.isArray(raw.images) && raw.images.length) {
    images = raw.images.map((x) => String(x));
  } else if (raw.image_url) {
    images = [String(raw.image_url)];
  } else if (raw.image) {
    images = [String(raw.image)];
  } else {
    images = [PLACEHOLDER_IMAGE];
  }

  return {
    id,
    name,
    desc: desc,
    price: priceOk,
    category,
    images,
    image: images[0],
  };
}

function loadJsonServices(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function categoryTitle(cat) {
  if (cat === "skin") return "جلسات العناية بالبشرة";
  if (cat === "laser") return "جلسات الليزر";
  return cat || "—";
}

function addToCart(item) {
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
}

export default function ServiceDetails() {
  const { id } = useParams();
  const [skin, setSkin] = useState([]);
  const [laser, setLaser] = useState([]);
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
        const lsSkin = loadJsonServices(STORAGE_SKIN);
        const lsLaser = loadJsonServices(STORAGE_LASER);
        nextSkin = lsSkin
          .map((r) => normalizeServiceItem(r, "skin"))
          .filter(Boolean);
        nextLaser = lsLaser
          .map((r) => normalizeServiceItem(r, "laser"))
          .filter(Boolean);
      } else {
        if (nextSkin.length === 0) {
          const ls = loadJsonServices(STORAGE_SKIN);
          nextSkin = ls
            .map((r) => normalizeServiceItem(r, "skin"))
            .filter(Boolean);
        }
        if (nextLaser.length === 0) {
          const ls = loadJsonServices(STORAGE_LASER);
          nextLaser = ls
            .map((r) => normalizeServiceItem(r, "laser"))
            .filter(Boolean);
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

  const allServices = useMemo(() => [...skin, ...laser], [skin, laser]);

  if (loading) {
    return (
      <div className="mc-page serviceDetailPage" dir="rtl">
        <p className="mc-loading mc-loading--inline" role="status">
          جاري تحميل الخدمات…
        </p>
      </div>
    );
  }

  if (id === "skin") {
    return (
      <CategorySection
        title="جلسات العناية بالبشرة"
        items={skin}
        showFetchError={showFetchError}
      />
    );
  }

  if (id === "laser") {
    return (
      <CategorySection
        title="جلسات الليزر"
        items={laser}
        showFetchError={showFetchError}
      />
    );
  }

  const service = allServices.find((s) => String(s.id) === String(id));

  if (!service) {
    return (
      <div className="mc-page serviceDetailPage" dir="rtl">
        <div className="serviceNotFound">
          <h1 className="mc-page-title">الخدمة غير موجودة</h1>
          <p className="mc-muted">
            لم يتم العثور على هذه الخدمة. قد تكون غير متوفرة أو تمت إزالتها.
          </p>
          <Link to="/services" className="detailStub-back">
            العودة إلى الخدمات
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mc-page serviceDetailPage" dir="rtl">
      <div className="serviceDetailCard">
        <div className="serviceDetailHero">
          <img
            src={service.images[0]}
            alt=""
            className="serviceDetailHeroImg"
          />
        </div>
        <span className="serviceCategoryPill">
          {categoryTitle(service.category)}
        </span>
        <h1 className="mc-section-title serviceDetailTitle">{service.name}</h1>
        <p className="serviceDetailDesc">{service.desc}</p>
        <p className="mc-catalog-price serviceDetailPrice">{service.price} ₪</p>

        <div className="serviceDetailActions">
          <button
            type="button"
            className="mc-btn mc-btn-primary mc-btn-block"
            onClick={() => addToCart(service)}
          >
            أضيفي إلى السلة
          </button>
          <Link
            to="/booking"
            className="mc-btn mc-btn-outline mc-btn-block serviceDetailLinkBtn"
          >
            احجزي الآن
          </Link>
          <Link to="/services" className="serviceBackLink">
            ← العودة إلى قائمة الخدمات
          </Link>
        </div>
      </div>
    </div>
  );
}

function CategorySection({ title, items, showFetchError }) {
  return (
    <div className="mc-page serviceDetailPage" dir="rtl">
      <h1 className="mc-page-title">{title}</h1>

      {showFetchError && (
        <div className="mc-alert mc-alert--error" role="alert">
          تعذر تحميل الخدمات من السيرفر، ولا توجد بيانات محفوظة محلياً. تحقق من
          الاتصال أو أضيفي الخدمات من لوحة التحكم.
        </div>
      )}

      {!showFetchError && items.length === 0 && (
        <p className="mc-muted serviceEmptyMsg">
          لا توجد خدمات في هذا القسم حالياً.
        </p>
      )}

      {items.length > 0 && (
        <div className="mc-catalog-grid">
          {items.map((item) => (
            <article key={String(item.id)} className="mc-catalog-card">
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
                  onClick={() => addToCart(item)}
                >
                  أضيفي إلى السلة
                </button>
                <Link
                  to="/booking"
                  className="mc-btn mc-btn-outline mc-btn-block serviceDetailLinkBtn"
                >
                  احجزي الآن
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="serviceBackWrap">
        <Link to="/services" className="serviceBackLink">
          ← العودة إلى جميع الخدمات
        </Link>
      </p>
    </div>
  );
}
