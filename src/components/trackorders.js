import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import '../styles/trackorders.css';

// Component to track orders made by the current shop user
export const TrackOrders = () => {
  // local state to store all orders
  const [orderlist, setorderlist] = useState([]);

  // grab current user's shop info
  const currentuserstore = localStorage.getItem("shopname");
  const currentUserId = localStorage.getItem("userid");

  // track whether data is still loading
  const [loading, setLoading] = useState(true);

  // fetch all orders from the backend when the component loads
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const functions = getFunctions();
        const getOrders = httpsCallable(functions, 'getOrders');
        const result = await getOrders({});

        // store all fetched orders
        setorderlist(result.data.orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        // loading is done (regardless of success/failure)
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // filter only the orders placed by this user
  const myorders = orderlist.filter((order) => order.userid === currentUserId);

  // navigation hook to move between pages
  const navigate = useNavigate();

  // button handler for navigating home
  function navigatehomepage() {
    navigate('/homepage');
  }

  // render
  return ( 
    <section className='trackorders-wrapper'>
      <section className='track-orders-page'>
        <h1>Track My Orders</h1>
        <button className='track-orders-page-btn' onClick={navigatehomepage}>← Home</button>

        {/* loader while data is being fetched */}
        {loading && (
          <section className='loader-wrapper'>
            <section className='loader'></section>
          </section>
        )}

        {/* once loading is done, show order details or empty state */}
        {!loading && (
          <section className='track-orders-page-section'>
            {myorders.length > 0 ? (
              // render each order and its products
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
              // fallback if there are no orders to show
              <p className="no-orders">You don't have any orders to track</p>
            )}
          </section>
        )}
      </section>
    </section>
  );
};
