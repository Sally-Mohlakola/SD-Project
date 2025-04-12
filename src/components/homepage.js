import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState } from 'react';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css

function SearchTab() {
  const [query, setQuery] = useState('');

  const handleChange = (event) => {
    setQuery(event.target.value);
    //console.log('Search product:', event.target.value);
  };

  return (
    <section className="format-search">
      <input
        type="text"
        placeholder="Search product..."
        value={query}
        onChange={handleChange}
        className="search-input" 
      />
    </section>
  );
}

export default SearchTab;

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
    <h1>HomePage</h1>
    <SearchTab />
    <button>My Shop</button>
    <button onClick={logout}>Logout</button>
</section>
)








};//end Homepage (returns homepage components when called)