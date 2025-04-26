import {  signOut} from 'firebase/auth';
import { auth} from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import '../styles/homepage.css';
import {db} from "../config/firebase";
import {getDocs,collection,updateDoc,doc} from "firebase/firestore";
import { updateCurrentUser } from 'firebase/auth/cordova';
//Import the get products in a shop here. to update to get all products in all
import {getProductsInShop} from "../components/myorders";

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


export const Homepage=()=>{
  const [search, setSearch] = useState('');
  const [orderlist,setorderlist]=useState([]);
  const currentUserId = localStorage.getItem("userid");
  const currentuserstore= localStorage.getItem("shopname");
  const ordercollectionRef=collection(db,"Orders");
  const shopcollectionRef=collection(db,"Shops");
  const [allProducts, setAllProducts] = useState([]);

  useEffect(() => {
    async function getRecommendedProducts() {
      const allShopsSnapshot = await getDocs(shopcollectionRef);
      const shopIds = allShopsSnapshot.docs.map(doc => doc.id);
    
      const allProductsArrays = await Promise.all(
        shopIds.map(async (shopId) => {
          const products = await getProductsInShop(shopId);
          return products.filter(product => product.price > 0);
        })
      );
    
      const allProductsList = allProductsArrays.flat();
      setAllProducts(allProductsList);
      console.log(allProducts);
    }
    
    getRecommendedProducts();
  }, []);

  //Search prompts are category and name (need to implement name later)
  const filterProduct = allProducts.filter(product => {
    const searchPrompt = search.toLowerCase(); // Ensuring the search term is in lowercase
    const nameMatch = product.name && product.name.toLowerCase().includes(searchPrompt);
    const categoryMatch = product.category && product.category.toLowerCase().includes(searchPrompt);
  
    return nameMatch || categoryMatch;
  });
  

    const navigate = useNavigate();
    const logout = async()=>{
        try{
            await signOut(auth);
            localStorage.removeItem("userid");
            localStorage.removeItem("shopname");
            navigate('/');
            }
            catch(error){
                console.log(error);
            }
    };
return (
<section>
    <h1>Natural Craft. Rooted in Care</h1>
    <p>Explore handmade wellness & artisan goods, crafted with purpose</p>
    <img id="img-welcome" alt="welcome banner"></img>{/*Welcome IMage*/}
    <SearchTab query={search} setSearch={setSearch} /> {/*Call the functions from above here*/}
    {/*Put search bar over image if possible, referencing Uber Eats website*/}
    <h2>Featured Artisan Picks</h2>
    {/*The items to add to cart will appear here. Coming soon.*/}
      {/*Display products here */}
      {allProducts.length > 0 ? (
        filterProduct.map(product => (
          <article key={product.name}>
            <h3>{product.name}</h3>
            <p>{product.itemdescription}</p>
            <p>Price: R{product.price}</p>
            <p>Quantity: {product.quantity}</p>
            <button>Buy</button>
          </article>
        ))
      ) : (
        <p>Loading products...</p>
      )}

    <img id="img-cart-icon" alt="cart"></img> {/*Sham referenced putting a pic here?*/}
    <button id="btn-cart"></button>{/*Can change later to element with item count*/}

    <nav className="sidebar-menu">
        <h1>Crafts & Grain</h1> {/*Can resize headers*/}
        <Link to="/myshop" className="btn-link-myshop"> My Shop </Link> {/*has JS file, the rest of links do not*/}
        <DropdownMenu/>
        <Link to= "/journal" className = "btn-link-journal">Journal</Link>
        {/*Can we use the journal for keeping track of buyer's order, clicking this button
        will lead to a page where you manage your order history*/}
        
        <Link to="/admin" className="btn-link-admin">Admin Dashboard</Link>
        <Link to="/aboutus" className="btn-link-aboutus">About Us</Link>
        <Link to="/contact" className="btn-link-contact">Contact</Link>
        <button onClick={logout}>Logout</button>
    </nav>

    <button id="btn-checkout">Checkout</button>{/*At the bottom, centre*/}
    
</section>
)








};//end Homepage (returns homepage components when called)
