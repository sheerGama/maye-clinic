import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h1>السلة</h1>

      {cart.length === 0 && <p>السلة فارغة</p>}

      {cart.map((item, i) => (
        <div key={i} style={row}>
          <img src={item.image} alt="" style={img} />
          <div>
            <strong>{item.name}</strong>
            <div>{item.type === "service" ? "جلسة" : "منتج"}</div>
          </div>
          <div>{item.price} ₪</div>
          <button onClick={() => removeItem(item.id)}>حذف</button>
        </div>
      ))}

      {cart.length > 0 && (
        <>
          <h2>الإجمالي: {total} ₪</h2>
          <Link to="/checkout">إتمام الطلب</Link>
        </>
      )}
    </div>
  );
}

const row = {
  display: "grid",
  gridTemplateColumns: "80px 1fr auto auto",
  gap: 10,
  alignItems: "center",
  padding: "10px 0",
  borderBottom: "1px solid #ddd",
};

const img = {
  width: 70,
  height: 70,
  objectFit: "cover",
  borderRadius: 8,
};
