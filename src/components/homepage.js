import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css';
import '../styles/homepage.css';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Search tab for shops and products
export function SearchTab({ query, setSearch }) {
  const handleChange = (event) => {
    setSearch(event.target.value);
  };

  return (
    <section className="format-search">
      <input
        type="text"
        placeholder="Shop the collection..."
        value={query}
        onChange={handleChange}
        className="search-input"
      />
    </section>
  );
}

// Price filter component
export function FilterPrice({ query, setPrice }) {
  const handleChange = (event) => {
    setPrice(event.target.value);
  };

  return (
    <section className="format-price">
      <label htmlFor="priceFilter">Filter by Price:</label>
      <select id="priceFilter" value={query} onChange={handleChange}>
        <option value="">-- All Prices --</option>
        <option value="under500">Under R500</option>
        <option value="500to999">R500 - R1000</option>
        <option value="1000to1999">R1000 - R1999</option>
        <option value="2000to5000">R2000 - R5000</option>
        <option value="above5000">Above R5000</option>
      </select>
    </section>
  );
}

// Category filter component with specified artisan categories
export function FilterCategory({ query, setCategory }) {
  const categories = [
    "-- All Categories --",
    "Pottery",
    "Paint",
    "Leatherwork",
    "Woodworking",
    "Weaving",
    "Metalwork",
    "Jewelry",
    "Knitting"
  ];

  const handleChange = (event) => {
    setCategory(event.target.value === "-- All Categories --" ? "" : event.target.value);
  };

  return (
    <section className="format-category">
      <label htmlFor="categoryFilter">Filter by Category:</label>
      <select id="categoryFilter" value={query} onChange={handleChange}>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </section>
  );
}

export const Homepage = () => {
  const navigate = useNavigate();
  const [chosenShop, setChosenShop] = useState('');
  const [search, setSearch] = useState('');
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [itemimadding, setitemimadding] = useState(null);
  const cart = sessionStorage.getItem("cart_items");
  const [cartitems, setcartitems] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const hvchosenshop = sessionStorage.getItem("chosenshop");
  const [priceFilter, setPriceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [shopImages, setShopImages] = useState({});

  useEffect(() => {
    let havechosenshop = '';
    let parsedCart = [];
    try {
      havechosenshop = hvchosenshop ? JSON.parse(hvchosenshop) : '';
      parsedCart = cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error parsing cart_items:", error);
      parsedCart = [];
    }
    setcartitems(parsedCart);
    setChosenShop(havechosenshop);
  }, [cart]);

  const goBackToDefaultHomePageView = () => {
    setQuantity(null);
    setitemimadding(null);
    setChosenShop(null);
    setcartitems([]);
    sessionStorage.removeItem("cart_items");
    sessionStorage.removeItem("chosenshop");
  }

  const currentUserID = localStorage.getItem("userid");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const getProductsInShop = httpsCallable(functions, "getProductsInShop");
        const result = await getAllShops({});
        const allshops = (result.data.shops).filter(shop => shop.userid !== currentUserID);
        const shopsWithProducts = [];

        for (const shop of allshops) {
          const productResult = await getProductsInShop({ shopid: shop.id });
          if (productResult.data.length > 0) {
            shopsWithProducts.push(shop);
          }
        }
        setAllShops(shopsWithProducts);
      } catch (err) {
        console.error('Error fetching shops:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (chosenShop && chosenShop.id) {
        setLoadingProducts(true);
        try {
          const functions = getFunctions();
          const getProductsInShop = httpsCallable(functions, "getProductsInShop");
          const response = await getProductsInShop({ shopid: chosenShop.id });
          setAllProducts(response.data);
        } catch (error) {
          console.error("Error fetching products:", error);
          setAllProducts([]);
        } finally {
          setLoadingProducts(false);
        }
      }
    };
    fetchProducts();
  }, [chosenShop]);

  const actionEnterShop = (shop, shopid) => {
    setChosenShop(shop);
    sessionStorage.setItem("chosenshop", JSON.stringify(shop));
    sessionStorage.setItem("chosenshopid", shopid);
  };

  const filterProduct = allProducts.filter(product => {
    const searchPrompt = search.toLowerCase();
    const nameEqual = product.name && product.name.toLowerCase().includes(searchPrompt);
    return nameEqual;
  });

  const filterShop = allShops.filter(shop => {
    const searchPrompt = search.toLowerCase();
    const nameEqual = shop.nameofshop && shop.nameofshop.toLowerCase().includes(searchPrompt);
    const categoryEqual = shop.category && shop.category.toLowerCase().includes(searchPrompt);
    const matchesCategory = !categoryFilter || 
                          (shop.category && shop.category.toLowerCase() === categoryFilter.toLowerCase());

    return (nameEqual || categoryEqual) && matchesCategory;
  });

  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
    } catch (error) {
      console.log(error);
    }
  };

  const Showcartitems = async () => {
    const items = cartitems;
    sessionStorage.setItem("cart_items", JSON.stringify(items));
    navigate('/checkout');
  };

  const AddtoCart = (itemid, name, description, price, quan) => {
    const prod = {
      id: itemid,
      name: name,
      itemdescription: description,
      price: price,
      quantity: quan
    }
    setcartitems(prevItems => [...prevItems, prod]);
    setQuantity(null);
  };

  useEffect(() => {
    const fetchAllShopImages = async () => {
      const functions = getFunctions();
      const findShopImage = httpsCallable(functions, 'findShopImage');
      const newImages = {};

      for (const shop of filterShop) {
        try {
          const result = await findShopImage({ url: shop.imageurl });
          newImages[shop.id] = result.data.imageUrl;
        } catch (error) {
          console.error(`Error loading image for ${shop.nameofshop}:`, error);
        }
      }
      setShopImages(newImages);
    };

    if (filterShop.length > 0) {
      fetchAllShopImages();
    }
  }, [filterShop]);

  return (
    <section className='section-home'>
      <h6 id="img-cart-icon" onClick={Showcartitems}><strong>Cart({cartitems.length})</strong></h6>
      <h1 id="message">Natural Craft. Rooted in Care</h1>
      <p>Explore handmade wellness & artisan goods, crafted with purpose</p>
      <img id="img-welcome" alt="welcome banner" src="https://i.pinimg.com/736x/68/e2/83/68e283a8eb6f5df2ba70dd0f3c79a24d.jpg"></img>

      {!chosenShop && (
        <>
          <SearchTab query={search} setSearch={setSearch} />
          <FilterCategory query={categoryFilter} setCategory={setCategoryFilter} />
          <section className='featShops'><h2>Artisanal Shops</h2></section>
          {loading ? (
            <section className='loader-wrapper'><section className='loader'> </section></section>
          ) : (
            filterShop.length > 0 ? (
              filterShop.map(shop => (
                <article className="shop-card" key={shop.id}>
                  <section className="shop-details">
                    <h3>{shop.nameofshop}</h3>
                    <p>{shop.description}</p>
                    <p><strong>Category:</strong> {shop.category}</p>
                    <button className="button" onClick={() => actionEnterShop(shop, shop.id)}>Enter Shop</button>
                  </section>
                  {shopImages[shop.id] && (
                    <img
                      src={shopImages[shop.id]}
                      alt={`${shop.nameofshop} logo`}
                      className="shop-image"
                    />
                  )}
                </article>
              ))
            ) : (
              <section className='np-shops-mesage'><p>No shops are listed yet.</p></section>
            )
          )}
        </>
      )}

      {chosenShop && (
        <>
          <SearchTab query={search} setSearch={setSearch} />
          <FilterPrice query={priceFilter} setPrice={setPriceFilter} />
          <h2 className='chosen-shop-header'>Artisanal works of {chosenShop.nameofshop}</h2>

          {!loadingProducts && (
            <section className='product-count'><p>Total number of products in shop: {filterProduct.length}</p></section>
          )}

          {loadingProducts ? (
            <section className='loader-wrapper'><section className='loader'> </section></section>
          ) : (
            <section className="product-listing-to-buy-view">
              {filterProduct.length > 0 ? (
                filterProduct
                  .filter((product) => {
                    if (priceFilter === "under500") return product.price < 500;
                    if (priceFilter === "500to999") return product.price >= 500 && product.price <= 999;
                    if (priceFilter === "1000to1999") return product.price >= 1000 && product.price <= 1999;
                    if (priceFilter === "2000to5000") return product.price >= 2000 && product.price <= 5000;
                    if (priceFilter === "above5000") return product.price > 5000;
                    return true;
                  })
                  .map((product) => (
                    <article key={product.id} className="product-article">
                      <section className="product-card">
                        <h3><strong>{product.name}</strong></h3>
                        <p>{product.itemdescription}</p>
                        <p><strong>Price:</strong> R{product.price}</p>
                        {product.id === itemimadding ? (
                          <section>
                            <p>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                              />
                            </p>
                            <button className='button'
                              type="submit"
                              onClick={() => {
                                if (!quantity || quantity <= 0 || quantity >= 100) {
                                  alert("Please add a valid quantity");
                                } else {
                                  AddtoCart(
                                    product.id,
                                    product.name,
                                    product.itemdescription,
                                    product.price,
                                    quantity
                                  );
                                  setitemimadding(null);
                                }
                              }}
                            >
                              Add To Cart
                            </button>
                          </section>
                        ) : (
                          <button className='button'
                            onClick={() => {
                              setitemimadding(product.id);
                              setQuantity(1)
                            }}
                          >
                            Buy
                          </button>
                        )}
                      </section>
                      <img
                        src={product.imageURL}
                        alt={product.name}
                        className="product-image"
                      />
                    </article>
                  ))
              ) : (
                <p>No artisanal products.</p>
              )}
              <section className='back-button-container'>
                <button className='back-button-home'
                  onClick={() => {
                    if (cartitems.length !== 0) {
                      const result = window.confirm(
                        "Going back to stores will clear your cart. Are you sure you want to proceed?"
                      );
                      if (result) {
                        goBackToDefaultHomePageView();
                      }
                    } else {
                      goBackToDefaultHomePageView();
                    }
                  }}
                >
                  ← Back
                </button>
              </section>
            </section>
          )}
        </>
      )}

      <nav className="sidebar-menu">
        <h1>Crafts & Grain</h1>
        <Link to="/myshop" className="btn-link-myshop"> My Shop </Link>
        <Link to="/trackorders" className="btn-link-contact">Track My Orders</Link>
        <button onClick={logout}>Logout</button>
      </nav>

      <button id="btn-checkout" onClick={Showcartitems}>Checkout</button>
    </section>
  );
};