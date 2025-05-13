import { useState, useEffect } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';


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
  <>
  <section>
        <h2>Track My Orders</h2>
        <button onClick={navigatehomepage}>← Homepage</button>
</section>
    {/* Loading state */}
    {loading && (
      <section>
        <p>Loading...</p>
      </section>
    )}

    {!loading && (
      <section>
    

        {/* Conditional rendering based on myorders */}
        {myorders.length > 0 ? (
          myorders.map((ord, index) => (
            <section key={index}>
              <h3>Order #{index + 1}</h3>
              {ord.products?.map((prod, index2) => (
                <div key={index2}>
                  <p><strong>Name:</strong> {prod?.nameofitem}</p>
                  <p><strong>Quantity:</strong> {prod?.quantity}</p>
                  <p><strong>Price:</strong> R{prod?.price}</p>
                </div>
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
);
};