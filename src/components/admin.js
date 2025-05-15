import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateDoc, doc } from "firebase/firestore";
import { functions } from "../config/firebase";
import { httpsCallable } from "firebase/functions";
import { db } from "../config/firebase";
import "../styles/adminshophomepage.css";

export const AdminShopHomepage = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const navigateHome = () => {
    navigate("/homepage");
  };

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const getShopsForAdmin = httpsCallable(functions, "getShopsForAdmin");
        const result = await getShopsForAdmin();
        const { shops } = result.data;
        setShops(shops);
      } catch (error) {
        console.error("Error fetching shops:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleStatusChange = async (shopId, newStatus) => {
    try {
      const shopRef = doc(db, "Shops", shopId);
      await updateDoc(shopRef, { status: newStatus });

      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === shopId ? { ...shop, status: newStatus } : shop
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) return <section>Loading...</section>;

  return (
    <section className="admin-dashboard">
      <button onClick={navigateHome}>← Home</button>
      <h1>Admin Dashboard</h1>

      {shops.map((shop) => (
        <article key={shop.id}>
          <h2>{shop.nameofshop}</h2>
          <p>{shop.description}</p>

          <label>
            Accept →
            <input
              type="checkbox"
              checked={shop.status === "Accepted"}
              onChange={() => handleStatusChange(shop.id, "Accepted")}
            />
          </label>
          <br />

          <label>
            Reject →
            <input
              type="checkbox"
              checked={shop.status === "Rejected"}
              onChange={() => handleStatusChange(shop.id, "Rejected")}
            />
          </label>

          <p>Status: {shop.status}</p>
          <hr />
        </article>
      ))}
    </section>
  );
};
