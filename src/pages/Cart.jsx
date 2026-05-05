import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./cart.css";
import { useLanguage } from "../i18n/LanguageContext";

export default function Cart() {
  const { t } = useLanguage();
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(JSON.parse(localStorage.getItem("cart-items")) || []);
  }, []);

  const removeItem = (id) => {
    const updated = cart.filter((i) => i.id !== id);
    setCart(updated);
    localStorage.setItem("cart-items", JSON.stringify(updated));
  };

  const total = cart.reduce((sum, i) => sum + Number(i.price), 0);

  return (
    <div className="cartPage">
      <h1 className="cartPageTitle">{t("cart.title")}</h1>
      {cart.length === 0 && (
        <div className="cartEmpty">
          <p>{t("cart.empty")}</p>
        </div>
      )}

      {cart.length > 0 && (
        <>
          <div className="cartList">
            {cart.map((item, i) => (
              <div key={`${item.id}-${i}`} className="cartRow">
                <img src={item.image} alt="" className="cartThumb" />
                <div className="cartMeta">
                  <strong>{item.name}</strong>
                  <div className="cartType">
                    {item.type === "service"
                      ? t("common.serviceType")
                      : t("common.productType")}
                  </div>
                </div>
                <div className="cartPrice">{item.price} ₪</div>
                <button
                  type="button"
                  className="cartRemove"
                  onClick={() => removeItem(item.id)}
                >
                  {t("cart.remove")}
                </button>
              </div>
            ))}
          </div>

          <div className="cartSummary">
            <p className="cartTotal">
              {t("cart.total")} <span>{total} ₪</span>
            </p>
            <Link to="/checkout" className="cartCheckout">
              {t("cart.checkout")}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
