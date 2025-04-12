import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import '../styles/homepage.css';
export function SearchTab() {
  const [query, setQuery] = useState('');

  const handleChange = (event) => {
    setQuery(event.target.value);
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
}

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
}

export const Homepage=()=>{
    const navigate = useNavigate();
    const logout = async()=>{
        try{
            await signOut(auth);
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
    <img id="img-welcome"></img>{/*Welcome IMage*/}
    <SearchTab /> {/*Call the functions from above here*/}
    {/*Put search bar over image if possible, referencing Uber Eats website*/}

    <img id="img-cart-icon"></img> {/*Sham referenced putting a pic here?*/}
    <button id="btn-cart"></button>{/*Can change later to element with item count*/}

    <nav className="sidebar-menu">
        <h1>Crafts & Grain</h1> {/*Can resize headers*/}
        <Link to="/myshop" className="btn-link-myshop"> My Shop </Link> {/*has JS file, the rest of links do not*/}
        <DropdownMenu/>
        <Link to= "/journal" className = "btn-link-journal">Journal</Link>
        {/*Can we use the journal for keeping track of buyer's order, clicking this button
        will lead to a page where you manage your order history*/}
        
        <Link to="/aboutus" className="btn-link-aboutus">About Us</Link>
        <Link to="/contact" className="btn-link-contact">Contact</Link>
        <button onClick={logout}>Logout</button>
    </nav>

    
    <h2>Featured Artisan Picks</h2>
    {/*The items to add to cart will appear here. Coming soon.*/}

    <button id="btn-checkout">Checkout</button>{/*At the bottom, centre*/}
    
</section>
)








};//end Homepage (returns homepage components when called)
