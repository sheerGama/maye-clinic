import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./cart.css";

export default function Cart() {
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
      <h1 className="cartPageTitle">السلة</h1>

      {cart.length === 0 && (
        <div className="cartEmpty">
          <p>السلة فارغة — أضيفي خدمات أو منتجات من المتجر.</p>
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
                    {item.type === "service" ? "جلسة" : "منتج"}
                  </div>
                </div>
                <div className="cartPrice">{item.price} ₪</div>
                <button
                  type="button"
                  className="cartRemove"
                  onClick={() => removeItem(item.id)}
                >
                  حذف
                </button>
              </div>
            ))}
          </div>

          <div className="cartSummary">
            <p className="cartTotal">
              الإجمالي: <span>{total} ₪</span>
            </p>
            <Link to="/checkout" className="cartCheckout">
              إتمام الطلب
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
