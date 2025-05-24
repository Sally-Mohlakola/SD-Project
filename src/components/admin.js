import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { functions } from "../config/firebase";
import { httpsCallable,getFunctions } from "firebase/functions";
import "../styles/adminshophomepage.css";

export const AdminShopHomepage = () => {
  //defined the usestates that we need 
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const navigateHome = () => {
    navigate("/homepage");
  };
//this usestate gets all the shops for the admin
  useEffect(() => {
    const fetchShops = async () => {
      try {
        //we call the firebase function 
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
//this functon is triggered when the admin changes the status of one of the shops 
  const handleStatusChange = async (shopId, newStatus) => {
    try {
      //call firebase function  to update the status of the shop 
      const functions = getFunctions();
      const updateShopStatus = httpsCallable(functions, 'updateShopStatus');
      // pass the new status and the shop id for the update
      const result =await updateShopStatus({shopStatus:newStatus, shopId:shopId});
      //if the change was successful then we must also update the change to also reflect on the frontend 
    if (result.data.success==true){   
      setShops((prevShops) =>
        prevShops.map((shop) =>
          shop.id === shopId ? { ...shop, status: newStatus } : shop
        )
      );
    }} catch (error) {
      console.error("Error updating status:", error);
    }
  };

  if (loading) return <section className="loader-wrapper">< p className="loader"></p></section>;

  return (
    <section className='admin-wrapper'>
    <section className="admin-dashboard">
      <button onClick={navigateHome} className="back">← Home</button>
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
</section>
  );
};
