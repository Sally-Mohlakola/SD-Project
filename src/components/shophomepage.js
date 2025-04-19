import React, { useState,useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection} from "firebase/firestore"



export const ShopHomepage =()=>{
    const currentUserId = localStorage.getItem("userid");
    const [shoplist,setShoplist]=useState([]);
    const shopcollectionRef=collection(db,"Shops");
    const [storename, setstorename] = useState("");
    
    
useEffect(()=>{
    const getshoplist= async()=>{
        try{
        const data=await getDocs(shopcollectionRef);
        const filterddata = data.docs.map((doc) => ({
            ...doc.data(), 
            userid: doc.data().userid,
            nameofshop: doc.data().nameofshop,
            description: doc.data().description,
            status: doc.data().status
          }));
        setShoplist(filterddata);
        }catch(err){
            console.error(err);
        }
    };
    getshoplist();
},[]);

    
useEffect(() => {
      const userShop = shoplist.find((shop) => shop.userid === currentUserId);
      if (userShop){
      setstorename(userShop.nameofshop); 

      }
    }, [shoplist, currentUserId]);

 localStorage.setItem("shopname", storename);

 return(
    <section>
      <h1>Welcome : {storename}</h1>
      <nav>
        {/*Can resize headers*/}
       <li> <Link to="/myproducts">My Products</Link></li>
       <li> <Link to="/myorders"> My Orders </Link> </li>
        <li><Link to="/inventory">Inventory</Link></li>
    </nav>

    
    </section>
  
 )
};