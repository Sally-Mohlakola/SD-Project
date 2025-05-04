import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase'; 
import { useNavigate } from 'react-router-dom';
import { getDocs, collection, updateDoc, doc } from 'firebase/firestore';
import '../styles/adminshophomepage.css'; 

export const AdminShopHomepage = () => {
  const [shops, setShops] = useState([]); // To store the fetched shop data
  const [loading, setLoading] = useState(true); // To track the loading state

  let navigate = useNavigate();

  function navigateHome(){
    navigate('/homepage');
  }

  // Fetch shop data when the component mounts
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const shopsRef = collection(db, 'Shops'); // Reference to Firestore 'Shops' collection
        const data = await getDocs(shopsRef); // Fetch the documents

        // Map through the documents and store in state
        const shopsData = data.docs.map((doc) => ({
          ...doc.data(),
          nameofshop: doc.data().nameofshop,
          description: doc.data().description,
          status: doc.data().status,
        }));

        setShops(shopsData); // Update the state with the fetched data
      } catch (error) {
        console.error(error); // Log any errors
      } finally {
        setLoading(false); // Set loading to false after the data is fetched
      }
    };

    fetchShops(); // Call the async function to fetch data
  }, []); // Empty dependency array means this runs once when the component mounts

  // Handle status change (Accept/Reject)
  const handleStatusChange = async (shopName, newStatus) => {
    try {
      const shopsRef = collection(db, 'Shops');
      const querySnapshot = await getDocs(shopsRef);
      const targetDoc = querySnapshot.docs.find((doc) => doc.data().nameofshop === shopName);

      if (targetDoc) {
        const shopRef = doc(db, 'Shops', targetDoc.id);
        await updateDoc(shopRef, { status: newStatus }); // Update Firestore document

        // Update the local state to reflect the change in the UI
        setShops((prevShops) =>
          prevShops.map((shop) =>
            shop.nameofshop === shopName ? { ...shop, status: newStatus } : shop
          )
        );
      }
    } catch (error) {
      console.error(error); // Log any errors
    }
  };

  if (loading) {
    return <section>Loading...</section>; // Show a loading message until data is fetched
  }
  
//Monitor the checkbox status for appropriate updates to the shop statuses
  return (
    <section className="admin-dashboard">
      <button onClick = {navigateHome}>← Home</button>
      <h1>Admin Dashboard</h1>

      {shops.map((shop) => (
        <article key={shop.nameofshop}>
          <h2>{shop.nameofshop}</h2>
          <p>{shop.description}</p>

          <label>
            Accept →
            <input
              type="checkbox"
              checked={shop.status === 'Accepted'}
              onChange={() => handleStatusChange(shop.nameofshop, 'Accepted')}
            />
          </label>
          <br />

          <label>
            Reject →
            <input
              type="checkbox"
              checked={shop.status === 'Rejected'}
              onChange={() => handleStatusChange(shop.nameofshop, 'Rejected')}
            />
          </label>

          <p>Status: {shop.status}</p>
          <hr />
        </article>
      ))}

      
    </section>
  );
};
