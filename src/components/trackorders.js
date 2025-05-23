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
  <>
  <section>
        <h1>Track My Orders</h1>
        <button className='track-orders-page-btn' onClick={navigatehomepage}>← Homepage</button>
</section>

    {/* Loading state */}
    {loading && (
      <section className='loader-wrapper'><section className='loader'> </section></section>
    )}

    {!loading && (
      <section className='track-orders-page-section'>
    

        {/* Conditional rendering based on myorders */}
        {myorders.length > 0 ? (
          myorders.map((ord, index) => (
            <section key={index}>
              <h3>Order #{index + 1}</h3>
              {ord.products?.map((prod, index2) => (
                <section key={index2}>
                  <p><strong>Name:</strong> {prod?.nameofitem}</p>
                  <p><strong>Quantity:</strong> {prod?.quantity}</p>
                  <p><strong>Price:</strong> R{prod?.price}</p>
                </section>
              ))}
              <p><strong>Address:</strong> {ord?.address}</p>
              <p><strong>Status:</strong> {ord?.status}</p>
            </section>
          ))
        ) : (
          <p>You don't have any orders to track</p>
        )}
      </section>
    )}
  </>
  </section>
  </section>
);
};
