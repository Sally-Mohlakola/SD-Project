import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css';
import '../styles/shopdashboard.css';
import { getFunctions, httpsCallable } from "firebase/functions";

// Shop dashboard landing page
export const ShopHomepage = () => {
    // grab user ID from local storage
    const currentUserId = localStorage.getItem("userid");

    // state for all shops (admin might have access to more than one)
    const [shoplist, setShoplist] = useState([]);

    // state for the name of this user’s shop
    const [storename, setStorename] = useState("");

    // show loading animation while fetching data
    const [loading, setLoading] = useState(true); 

    // state to hold the shop's image (after resolving from backend)
    const [shopimage, setShopimage] = useState("");

    // simple error handler
    const [error, setError] = useState(null);

    useEffect(() => {
        const getShopList = async () => {
            try {
                const functions = getFunctions();
                const getAllShops = httpsCallable(functions, 'getAllShops');

                // call backend Cloud Function to fetch all shops
                const result = await getAllShops({});

                // save shop data to state
                setShoplist(result.data.shops);
            } catch (err) {
                // error if the fetch fails
                setError("Failed to load shop data");
                console.error(err);
            } finally {
                // done loading, whether success or fail
                setLoading(false);
            }
        };

        getShopList();
    }, []); // runs only once when the component mounts

    useEffect(() => {
        const setDisplay = async () => {
            // look through all shops and find the one tied to current user
            const userShop = shoplist.find((shop) => shop.userid === currentUserId);

            // if user owns a shop, set its info
            if (userShop) {
                setStorename(userShop.nameofshop);

                // store the ID and name locally for other pages
                localStorage.setItem('shopid', userShop.id);
                localStorage.setItem("shopname", userShop.nameofshop);

                try {
                    // now try to get the image URL
                    const functions = getFunctions();
                    const findShopImage = httpsCallable(functions, 'findShopImage');

                    const result = await findShopImage({ url: userShop.imageurl });

                    // update state with final image URL
                    setShopimage(result.data.imageUrl);
                } catch (err) {
                    // image fetching failed (not critical, so we just log it)
                    console.error("Error loading shop image:", err);
                }
            }
        };

        // don’t run this unless the shoplist has finished loading
        if (shoplist.length > 0) {
            setDisplay();
        }
    }, [shoplist, currentUserId]); // run again only if shoplist or user ID changes

  
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
            {/* greeting with the store name */}
            <h1 className='storeDash-heading'>Welcome {storename}</h1>

            {/* show shop logo if available */}
            <section className='shop-logo-container'>
                {shopimage && (
                    <img 
                        src={shopimage} 
                        alt={`${storename} logo`} 
                        className='shop-logo-image'
                        onError={(e) => {
                            // fallback: hide image if URL is broken
                            e.target.style.display = 'none';
                        }}
                    />
                )}
            </section>
            
            {/* section of dashboard links */}
            <section className='storeDash-links'>
                <p className="shopmanagep">Shop management dashboard</p>

                {/* nav links to sub-pages */}
                <nav>
                    <ul>
                        <li><Link to="/displayproducts">My Products</Link></li>
                        <li><Link to="/myorders">My Orders</Link></li>
                        <li><Link to="/myinventory">Inventory</Link></li>
                    </ul>
                </nav>

                {/* back home */}
                <Link to="/homepage" className='home-link'>← Home</Link>
            </section>
        </section>
    );
};
