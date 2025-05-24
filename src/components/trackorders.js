import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import '../styles/trackorders.css'

export const TrackOrders=()=>{
  const [orderlist, setorderlist] = useState([]);
  const currentuserstore = localStorage.getItem("shopname");
 const currentUserId = localStorage.getItem("userid");
const [loading, setLoading] = useState(true);
useEffect(() => {
    const fetchOrders = async () => {
      try {
        const functions = getFunctions();
        const getOrders = httpsCallable(functions, 'getOrders');
        const result = await getOrders({});
        setorderlist(result.data.orders);
        setLoading(false);
      
      } catch (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
      } 
       
    }
    
    
    fetchOrders();
  }, []);

const myorders = orderlist.filter((order) => order.userid === currentUserId);
 let navigate = useNavigate();

  function navigatehomepage() {
    navigate('/homepage');
  }
   return ( 
  <section className='trackorders-wrapper'>
    <section className='track-orders-page'>
      <h1>Track My Orders</h1>
      <button className='track-orders-page-btn' onClick={navigatehomepage}>← Home</button>

      {loading && (
        <section className='loader-wrapper'>
          <section className='loader'></section>
        </section>
      )}

      {!loading && (
        <section className='track-orders-page-section'>
          {myorders.length > 0 ? (
            myorders.map((ord, index) => (
              <section key={index} className="order-container">
                <section className="order-header">
                  <h3>Order: #{index + 1}</h3>
                  <section className="order-status">Status: {ord?.status}</section>
                </section>
                
                {ord.products?.map((prod, index2) => (
                  <section key={index2} className="product-item">
                    <section className="product-info">
                      <p className="product-name">{prod?.nameofitem}</p>
                      <section className="product-meta">
                        <p>Qty: {prod?.quantity}</p>
                        <p className="product-price">R{prod?.price}</p>
                      </section>
                    </section>
                  </section>
                ))}
                
                <section className="order-address">
                  <p><strong>Delivery Address:</strong> {ord?.address}</p>
                </section>
              </section>
            ))
          ) : (
            <p className="no-orders">You don't have any orders to track</p>
          )}
        </section>
      )}
    </section>
  </section>
);
};
