import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import '../styles/myshop.css';

export const MyShop = () => {
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('userid');
  const [shoplist, setShoplist] = useState([]);
  const [ispublic, setIspublic] = useState('');
  const [store, setstore] = useState('');

  // Fetch shop list
  useEffect(() => {
    const getshoplist = async () => {
      try {
        const functions = getFunctions(app);
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        setShoplist(result.data.shops);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    getshoplist();
  }, []);

  // Find user's shop
  useEffect(() => {
    if (!loading && shoplist.length > 0) {
      const userShop = shoplist.find((shop) => shop.userid === currentUserId);
      if (userShop) {
        setstore(userShop);
        setIspublic(userShop.status);
      }
      setIsReady(true);
    }
  }, [shoplist, currentUserId, loading]);

  // Redirect if accepted
  useEffect(() => {
    if (ispublic === 'Accepted') {
      navigate('/shopdashboard');
    }
  }, [ispublic, navigate]);

  const startshop = () => navigate('/createshop');
  const backhome = () => navigate('/homepage');

  const deleterejectedshop = async (id, Iurl) => {
    try {
      const functions = getFunctions(app);
      const deleteShop = httpsCallable(functions, 'deleteShop');
      const res = await deleteShop({ shopId: id, userId: currentUserId, url: Iurl });
      console.log(res.data.message);
    } catch (err) {
      console.error('Error deleting shop:', err);
    }
  };

  if (loading || !isReady) return <section className="shop-section"></section>;

  if (ispublic === 'Rejected') {
    return (
      <section className="shop-section">
        <section className="message-container">
          <h2>Your request to open a store was rejected. Please try again.</h2>
          <section className="button-group">
            <button
              onClick={() => {
                deleterejectedshop(store.id, store.imageurl);
                navigate('/createshop');
              }}
            >
              Apply to open shop again
            </button>
          </section>
        </section>
      </section>
    );
  }

  if (store === '') {
    return (
      <section className="shop-section">
        <section className="message-container">
          <h1>You don't have a shop yet</h1>
          <section className="button-group">
            <button className="start-shop" onClick={startshop}>
              Start my shop?
            </button>
            <button onClick={backhome}>Home</button>
          </section>
        </section>
      </section>
    );
  }

  if (ispublic === 'Awaiting') {
    return (
      <section className="shop-section">
        <section className="message-container">
          <h1>The admin has not cleared your store yet!</h1>
          <section className="button-group">
            <button onClick={backhome}>Home</button>
          </section>
        </section>
      </section>
    );
  }

  return null;
};