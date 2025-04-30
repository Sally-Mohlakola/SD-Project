import {  signOut} from 'firebase/auth';
import { auth} from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, use } from 'react';
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

//function to filter the products in a shop by the prices
//it uses a dropdown menu
export function FilterPrice({query, setPrice}){
  const handleChange = (event) => {
    setPrice(event.target.value);
  };

  return (
    <section className="format-price">
      <label htmlFor="priceFilter">Filter by Price:</label>
      <select id = "priceFilter" value = {query} onChange={handleChange}>
        <option value="">All Prices</option>
        <option value="under50">Under R50</option>
        <option value="50to100">R50-R100</option>
        <option value="above100">Above R100</option>
      </select>
    </section>
  );
}//FilterPrice

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
  //Button navigation system
  const navigate = useNavigate();

  


  const [chosenShop, setChosenShop] = useState('');
  const [searchShop, setSearchShop] = useState('');
  const [search, setSearch] = useState('');
  const [orderlist,setorderlist]=useState([]);
  const currentUserId = localStorage.getItem("userid");
  const currentuserstore= localStorage.getItem("shopname");
  const ordercollectionRef=collection(db,"Orders");
  const shopcollectionRef=collection(db,"Shops");
  const [allProducts, setAllProducts] = useState([]);
  const [quantity, setQuantity] = useState(null);
  const [itemimadding,setitemimadding]=useState(null);
  const cart=sessionStorage.getItem("cart_items");
  const [cartitems, setcartitems] = useState([]);
  const [allShops, setAllShops] = useState([]); //Store all shops in the system
  const [loading, setLoading] = useState(true); //Loading state
  const hvchosenshop=sessionStorage.getItem("chosenshop");
  const [priceFilter, setPriceFilter] = useState("");//used for price filtering
  const [goingback,setgoingback]=useState(false);

  useEffect(() => {
    let havechosenshop='';
    let parsedCart = [];
    try {
      havechosenshop= hvchosenshop?  JSON.parse(hvchosenshop):'';
      parsedCart = cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error parsing cart_items:", error);
      parsedCart = []; 
    }
    setcartitems(parsedCart);
    setChosenShop(havechosenshop);
  }, [cart]);
  console.log(cartitems);
console.log('chosenshop',hvchosenshop);

   const goBackToDefaultHomePageView = () => {
    setQuantity(null);
    setitemimadding(null);
    setChosenShop(null); //Setting the chosen shop to null will revert to default view
    setcartitems([]);
    sessionStorage.removeItem("cart_items");
    sessionStorage.removeItem("chosenshop");
    //setShopProducts([]);
  }

  const currentUserID = localStorage.getItem("userid");
  // Fetching all the shop data
    useEffect(() => {
      const fetchShops = async () => {
        try {
          const shopsRef = collection(db, 'Shops'); // Referencing to Firestore 'Shops' collection
          const data = await getDocs(shopsRef);
  
          // Map the docs of each shop
          const shopsData = data.docs.map((doc) => ({
            ...doc.data(),
            id: doc.id,
            shopid: doc.data().userid,
            nameofshop: doc.data().nameofshop,
            description: doc.data().description,
          })).filter(shop => shop.userid!== currentUserID);;

          setAllShops(shopsData); //Update array with all shops data
        } catch (error)
        {
          console.error(error); 
        } finally
        {
          setLoading(false);//Make sure that loading is set to false since data has loaded
        }
      };
      fetchShops(); 
    }, []); 

    //Once a user choses a shop, look through the products of that shop
    useEffect(() => {
      if (chosenShop) {
        const fetchProducts = async () => {
          const products = await getProductsInShop(chosenShop.id);
          setAllProducts(products); //Set the products for the chosenShop
        };
        fetchProducts();
      }}, [chosenShop]);

    const actionEnterShop = (shop) => {
      setChosenShop(shop); //Set the chosenShop by clicking "Enter Shop" button
      //store the chosen shop in the storage for later use and cheakout 
       sessionStorage.setItem("chosenshop",JSON.stringify(shop));
    };


  //Search prompts are category and name (need to implement name later)
  const filterProduct = allProducts.filter(product => {
    const searchPrompt = search.toLowerCase(); // Ensuring the search term is in lowercase
    const nameEqual = product.name && product.name.toLowerCase().includes(searchPrompt);
    const priceEqual = product.category && product.category.toLowerCase().includes(searchPrompt);
  //change the parameters to price later
    return nameEqual || priceEqual;
  });

  const filterShop = allShops.filter(shop => {
    const searchPrompt = search.toLowerCase(); // Ensuring the search term is in lowercase
    const nameEqual = shop.nameofshop&& shop.nameofshop.toLowerCase().includes(searchPrompt);
    const categoryEqual = shop.category && shop.category.toLowerCase().includes(searchPrompt);
  
    return nameEqual || categoryEqual;
  });

    

    //Logout functionality 
    const logout = async()=>{
        try{
            await signOut(auth);
            localStorage.removeItem("userid");
            localStorage.removeItem("shopname");
            sessionStorage.removeItem("cart_items");
            sessionStorage.removeItem("chosenshop");
            navigate('/');
            }
            catch(error){
                console.log(error);
            }
    };
//////////////////////////////////////////////////////////////////////////////////////////////////////////
//CART LOGIC

const Showcartitems= async()=>{
const items=cartitems;
sessionStorage.setItem("cart_items",JSON.stringify(items));
navigate('/checkout');
};

const AddtoCart=(id,name,description,price,quan)=>{
  const prod={
    id:id,
    name:name,
    itemdescription:description,
    price:price,
    quantity:quan
  }
  setcartitems(prevItems => [...prevItems, prod]);
setQuantity(null);
};



///////////////////////////////////////////////////////////////////////////////////////////////////////////

return (
<section>
    <h1>Natural Craft. Rooted in Care</h1>
    <p>Explore handmade wellness & artisan goods, crafted with purpose</p>
    <img id="img-welcome" alt="welcome banner"></img>{/*Welcome IMage*/}
   
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
                <button onClick={() => actionEnterShop(shop)}>Enter Shop</button>
                </article>
              ))
            ) : (
              <p>No shops are listed yet.</p>
            )
          )}
        </>
      )}




      {/* Show the products when a shop is selected and call filterProduct since it preps AllProducts for search */}
      {chosenShop && (<>
        <SearchTab query={search} setSearch={setSearch} /> {/*Call the functions from above here*/}
        <FilterPrice query={priceFilter} setPrice={setPriceFilter} />
        <h2>Artisanal works of {chosenShop.nameofshop}</h2>
    
        <p>Number of listings: {filterProduct.length}</p>
        {/* Show the filtered products here, images will also go here */}
        <section className="product-listing-to-buy-view">
        {filterProduct.length > 0 ? (
          filterProduct
          //filter products by price
            .filter((product) => {
              if (priceFilter === "under50") {
                return product.price < 50;
              } else if (priceFilter === "50to100") {
                return product.price >= 50 && product.price <= 100;
              } else if (priceFilter === "above100") {
                return product.price > 100;
              }
              return true; // No filter applied === "All prices"
            })
            .map((product) => (
                <article key={product.id}>
                    <h3>{product.name}</h3>
                    <p>{product.itemdescription}</p>
                    <p>Price: R{product.price}</p>

                {product.id===itemimadding? (
                  <section>
                <p>
                <input type='number' min="1" onChange={(e)=> setQuantity(e.target.value)}></input>
                </p>
                <button onClick={()=>{
                  if(!quantity){
                    alert("Please add a quantity ");
                  }
              else{
                  AddtoCart(product.id,product.name,product.itemdescription,product.price,quantity);
                  setitemimadding(null); 
                }
                }}>Add To Cart</button> 
                </section>
                ):(
                <button onClick={()=>{
                  setitemimadding(product.id);
                  console.log('productid',product.id);}
                }>Buy</button>)}
            
                </article>
              ))
            ) : (
              <p>No artisanal products.</p>
            )}
            
             <button onClick={()=>{
              if (!cartitems.length==0){
                const result = window.confirm("Going back to stores will clear your cart ,Are you sure you want to proceed?");
                if (result) {
                  goBackToDefaultHomePageView();
                } 
                
              }
              else{
              goBackToDefaultHomePageView();
              }
              }} >Back</button>
          </section>
        </>
      )
      }
    
    <h6 id="img-cart-icon" onClick={Showcartitems}>Cart({cartitems.length})</h6>
    {/*Sham referenced putting a pic here?*/}
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

    <button id="btn-checkout" onClick={Showcartitems}>Checkout</button>{/*At the bottom, centre*/}
    
</section>
)





};//end Homepage (returns homepage components when called)
