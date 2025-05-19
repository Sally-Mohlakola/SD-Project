import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import '../styles/homepage.css';
import { db } from "../config/firebase";
import { getDocs, collection, updateDoc, doc } from "firebase/firestore";
//Import the get products in a shop here. to update to get all products in all
import { getProductsInShop } from "../components/myorders";
import { getFunctions, httpsCallable } from 'firebase/functions';

// Search tab for shops and products
export function SearchTab({ query, setSearch }) {
  const handleChange = (event) => {
    setSearch(event.target.value);
    //console.log('Search product:', event.target.value);
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
}//END

//function to filter the products in a shop by the prices
//it uses a dropdown menu
export function FilterPrice({ query, setPrice }) {
  const handleChange = (event) => {
    setPrice(event.target.value);
  };

  return (
    <section className="format-price">
      <label htmlFor="priceFilter">Filter by Price:</label>
      <select id="priceFilter" value={query} onChange={handleChange}>
        <option value="">All Prices</option>
        <option value="under50">Under R50</option>
        <option value="50to100">R50-R100</option>
        <option value="above100">Above R100</option>
      </select>
    </section>
  );
}//FilterPrice

// Drop down menu discarded
export function DropdownMenu() {
  const [selected, setSelected] = useState('');

  const handleChange = (event) => {
    setSelected(event.target.value);
  };

  return (
    <section className="products-dropdown-menu">
      <label>Collections</label>
      <select id="selected-product" value={selected} onChange={handleChange}>
        <option value="">--Select--</option>
        <option value="vases">Vases</option>
        <option value="basketry">Basketry</option>
        <option value="glassware">Glassware</option>{/*firebase: introduce product codes?*/}
      </select>

      {/* {selected} records selected option, can remove later. Useful for database*/}
    </section>
  );
}//END



export const Homepage = () => {
  //Button navigation system
  const navigate = useNavigate();

  const [chosenShop, setChosenShop] = useState('');
  const [searchShop, setSearchShop] = useState('');
  const [search, setSearch] = useState('');
  const [orderlist, setorderlist] = useState([]);
  const currentUserId = localStorage.getItem("userid");
  const currentuserstore = localStorage.getItem("shopname");
  const ordercollectionRef = collection(db, "Orders");
  const shopcollectionRef = collection(db, "Shops");
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [itemimadding, setitemimadding] = useState(null);
  const cart = sessionStorage.getItem("cart_items");
  const [cartitems, setcartitems] = useState([]);
  const [allShops, setAllShops] = useState([]); //Store all shops in the system
  const [loading, setLoading] = useState(true); //Loading state
  const hvchosenshop = sessionStorage.getItem("chosenshop");
  const [priceFilter, setPriceFilter] = useState("");//used for price filtering
  const [goingback, setgoingback] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);


  // Allow user to go to see cart items
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
  console.log(cartitems);
  console.log('chosenshop', hvchosenshop);

  // The default home view is the screen where the user sees the menu of shops
  const goBackToDefaultHomePageView = () => {
    setQuantity(null);
    setitemimadding(null);
    setChosenShop(null); //Setting the chosen shop to null will revert to default view
    setcartitems([]);
    sessionStorage.removeItem("cart_items");
    sessionStorage.removeItem("chosenshop");
    //setShopProducts([]);
  }

  // Fetch this logged in user's id from local storage.
  const currentUserID = localStorage.getItem("userid");
  // Fetching all the shop data
  useEffect(()=>{
    const fetchShops= async()=>{
        try{
        const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        const shopsData=(result.data.shops).filter(shop => shop.userid !== currentUserID);
        setAllShops(shopsData); 
        }catch(err){
            console.error('Error fetching shops:', err);
        }finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  //Once a user choses a shop, look through the products of that shop

useEffect(() => {
  const fetchProducts = async () => {
    if (chosenShop && chosenShop.id) {
      setLoadingProducts(true); // start loading
      try {
        const functions = getFunctions();
        const getProductsInShop = httpsCallable(functions, "getProductsInShop");
        const response = await getProductsInShop({ shopid: chosenShop.id });
        setAllProducts(response.data);
      } catch (error) {
        console.error("Error fetching products via cloud function:", error);
        setAllProducts([]);
      } finally {
        setLoadingProducts(false); // done loading
      }
    }
  };

  fetchProducts();
}, [chosenShop]);



  const actionEnterShop = (shop) => {
    setChosenShop(shop); //Set the chosenShop by clicking "Enter Shop" button
    //store the chosen shop in the storage for later use and cheakout 
    sessionStorage.setItem("chosenshop", JSON.stringify(shop));
  };


  //Search prompts is name of product (need to implement name later)
  const filterProduct = allProducts.filter(product => {
    const searchPrompt = search.toLowerCase(); // Ensuring the search term is in lowercase
    const nameEqual = product.name && product.name.toLowerCase().includes(searchPrompt);
    return nameEqual;
  });

  //Search prompts for name and category of shops
  const filterShop = allShops.filter(shop => {
    const searchPrompt = search.toLowerCase(); // Ensuring the search term is in lowercase
    const nameEqual = shop.nameofshop && shop.nameofshop.toLowerCase().includes(searchPrompt);
    const categoryEqual = shop.category && shop.category.toLowerCase().includes(searchPrompt);

    return nameEqual || categoryEqual;
  });



  //Logout functionality (direct user to auth page) 
  const logout = async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();
      navigate('/');
    }
    catch (error) {
      console.log(error);
    }
  };
  //////////////////////////////////////////////////////////////////////////////////////////////////////////
  //ADDTOCART LOGIC

  const Showcartitems = async () => {
    const items = cartitems;
    sessionStorage.setItem("cart_items", JSON.stringify(items));
    navigate('/checkout');
  };

  // cart fields for each product
  const AddtoCart = (id, name, description, price, quan) => {
    const prod = {
      id: id,
      name: name,
      itemdescription: description,
      price: price,
      quantity: quan
    }
    setcartitems(prevItems => [...prevItems, prod]);
    setQuantity(null);
  };



  ///////////////////////////////////////////////////////////////////////////////////////////////////////////

  return (
    <section>
      <h6 id="img-cart-icon" onClick={Showcartitems}>Cart({cartitems.length})</h6>
      <h1 id="message">Natural Craft. Rooted in Care</h1>
      <p>Explore handmade wellness & artisan goods, crafted with purpose</p>
      <img id="img-welcome" alt="welcome banner" src="https://i.pinimg.com/736x/68/e2/83/68e283a8eb6f5df2ba70dd0f3c79a24d.jpg" ></img>{/*Welcome IMage*/}

      {/*Put search bar over image if possible, referencing Uber Eats website*/}
      <h2>Featured Artisan Picks</h2>
      {/*The items to add to cart will appear here. Coming soon.*/}
      {/*Display products here */}

      {/* Show shops if no shop is selected */}
      {!chosenShop && (
        <>
          <SearchTab query={search} setSearch={setSearch} /> {/*Call the functions from above here*/}
          <h2>Featured Shops</h2>
          {loading ? (
            <p>Loading shops...</p>) : (
            filterShop.length > 0 ? (
              filterShop.map(shop => (
                <article key={shop.id}>
                  <h3>{shop.nameofshop}</h3>
                  <p>{shop.description}</p>
                  <p>Category: {shop.category}</p>
                  <button className='button' onClick={() => actionEnterShop(shop)}>Enter Shop</button>
                </article>
              ))
            ) : (
              <p>No shops are listed yet.</p>
            )
          )}
        </>
      )}



      {/* Show the products when a shop is selected and call filterProduct since it preps AllProducts for search */}
      {chosenShop && (
  <>
    <SearchTab query={search} setSearch={setSearch} />
    <FilterPrice query={priceFilter} setPrice={setPriceFilter} />
    <h2>Artisanal works of {chosenShop.nameofshop}</h2>


    {!loadingProducts && (
      <p>Total number of products in shop: {filterProduct.length}</p>
    )}

    {/* Load products when fetching to prevent flickering of changes */}
    {loadingProducts ? (
      <p>Loading products...</p>
    ) : (

      <section className="product-listing-to-buy-view">
        {filterProduct.length > 0 ? (
          filterProduct
            .filter((product) => {
              if (priceFilter === "under50") {
                return product.price < 50;
              } else if (priceFilter === "50to100") {
                return product.price >= 50 && product.price <= 100;
              } else if (priceFilter === "above100") {
                return product.price > 100;
              }
              return true;
            })
            .map((product) => (
              <article key={product.id}>
                <h3>{product.name}</h3>
                <p>{product.itemdescription}</p>
                <p>Price: R{product.price}</p>

                {product.id === itemimadding ? (
                  <section>
                    <p>
                      <input
                        type="number"
                        min="1"
                        max="999"
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </p>
                    <button
                      type="submit"
                      onClick={() => {
                        if (!quantity || quantity <= 0 || quantity >= 1000) {
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
                  <button
                    onClick={() => {
                      setitemimadding(product.id);
                    }}
                  >
                    Buy
                  </button>
                )}
              </article>
            ))
        ) : (
          <p>No artisanal products.</p>
        )}

        <button
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
          Back
        </button>
      </section>
    )}
  </>
)}

     

      <nav className="sidebar-menu">
        <h1>Crafts & Grain</h1> {/*Can resize headers*/}
        <Link to="/myshop" className="btn-link-myshop"> My Shop </Link> {/*has JS file, the rest of links do not*/}
        <Link to="/trackorders" className="btn-link-contact">Track My Orders</Link>
        <Link to="/aboutus" className="btn-link-aboutus">About Us</Link>*/
       <Link to="/contact" className="btn-link-contact">Contact</Link>*/
         
        <button onClick={logout}>Logout</button>
      </nav>

      <button id="btn-checkout" onClick={Showcartitems}>Checkout</button>{/*At the bottom, centre*/}

    </section>
  )





};//end Homepage (returns homepage components when called)
