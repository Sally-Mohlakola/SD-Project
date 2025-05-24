import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css';
import '../styles/shopdashboard.css';
import { getFunctions, httpsCallable } from "firebase/functions";

export const ShopHomepage = () => {
    const currentUserId = localStorage.getItem("userid");
    const [shoplist, setShoplist] = useState([]);
    const [storename, setStorename] = useState("");
    const [loading, setLoading] = useState(true); 
    const [shopimage, setShopimage] = useState("");
    const [error, setError] = useState(null);

    // Fetch shop list
    useEffect(() => {
        const getShopList = async () => {
            try {
                const functions = getFunctions();
                const getAllShops = httpsCallable(functions, 'getAllShops');
                const result = await getAllShops({});
                setShoplist(result.data.shops);
            } catch (err) {
                setError("Failed to load shop data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        getShopList();
    }, []);

    // Set shop display info
    useEffect(() => {
        const setDisplay = async () => {
            const userShop = shoplist.find((shop) => shop.userid === currentUserId);
            if (userShop) {
                setStorename(userShop.nameofshop);
                localStorage.setItem("shopname", userShop.nameofshop);

                try {
                    const functions = getFunctions();
                    const findShopImage = httpsCallable(functions, 'findShopImage');
                    const result = await findShopImage({ url: userShop.imageurl });
                    setShopimage(result.data.imageUrl);
                } catch (err) {
                    console.error("Error loading shop image:", err);
                }
            }
        };

        if (shoplist.length > 0) {
            setDisplay();
        }
    }, [shoplist, currentUserId]);

    if (loading) {
        return (
            <section className='loader-wrapper'>
                <section className='loader'></section>
            </section>
        );
    }

    if (error) {
        return (
            <section className='storeDash-section'>
                <h1 className='storeDash-heading'>Error</h1>
                <p>{error}</p>
                <Link to="/homepage">Return Home</Link>
            </section>
        );
    }

    return (
        <section className='storeDash-section'>
            <h1 className='storeDash-heading'>Welcome {storename}</h1>
            <section className='shop-logo-container'>
                {shopimage && (
                    <img 
                        src={shopimage} 
                        alt={`${storename} logo`} 
                        className='shop-logo-image'
                        onError={(e) => {
                            e.target.style.display = 'none';
                        }}
                    />
                )}
            </section>
            
            <section className='storeDash-links'>
               <p className="shopmanagep">Shop management dashboard</p>
                <nav>
                    <ul>
                        <li><Link to="/displayproducts">My Products</Link></li>
                        <li><Link to="/myorders">My Orders</Link></li>
                        <li><Link to="/myinventory">Inventory</Link></li>
                    </ul>
                </nav>
                <Link to="/homepage" className='home-link'>← Home</Link>
            </section>
        </section>
    );
};