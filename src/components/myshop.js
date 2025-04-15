
import React, { useState,useEffect } from 'react';
//import { useNavigate } from "react-router-dom";
//import React, { useState } from 'react';
//import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection,addDoc} from "firebase/firestore"
import { useNavigate } from "react-router-dom";


export const MyShop=()=>{
  

    const navigate = useNavigate();
    const currentUserId = localStorage.getItem("userid");
    const [shoplist,setShoplist]=useState([]);
    const shopcollectionRef=collection(db,"Shops");
// this useeffect gets all the items form our database "Shops"  and fliters it bc firebase sends us a bunch of data that has nothing to do with us so we filter all of that and bring only the data we need which is our shops and thier fields
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






const [ispublic, setIspublic] = useState("");
const [store, setstore] = useState("");


//this useeffeect go through the shoplist that we previously got from the database and looks for the user's shop and its status by thier user id 
useEffect(() => {
    const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    if(userShop){
    setstore(userShop);
    setIspublic(userShop.status); 
    };
 
  }, [shoplist, currentUserId]);
//new shop states
const [newshopname,setnewshopname]=useState("");
const [newshopdescription,setnewshopdescription]=useState("");
const [submitted, setSubmitted] = useState(false);
const [category, setcategory] = useState("");

// when the new user starts thier shop this function is executed to create thier store on the database 
const sendtoadmin= async()=>{
try{
    await addDoc(shopcollectionRef,{userid:currentUserId,nameofshop:newshopname,description:newshopdescription,status:"Awaiting",category:category})
  }catch(err){
  console.error(err);
  };
  setSubmitted(true); 
};
//if the store has been cleared by admin they must go to thier store
  if (ispublic==="Accepted") {
    navigate("/shopdashboard");
    return 0;
  }
  // if the users store has not been cleared by admin
if (ispublic==="Awaiting"){
  return (
    <h1>The admin has not cleared your store yet!</h1>
  );
}
//if the user has no store they must create one 
if (!store) {
  return (

  <section>
  <h1>My Shop</h1>
  {/*this "submitted" checks if the person pressed the button to submit thier store to the admin" */}
  {submitted? (
  <p>Your shop has been sent to admin</p>
  ):(
      <form>
        <ul>
          <li><label>Name of shop</label></li>
          <li><input type="text" onChange={(e)=> setnewshopname(e.target.value)} /></li>
          <li><label>Shop description</label></li>
          <label>Category:</label>
              <select onChange={(e)=> setcategory(e.target.value)}>
              <option value="" disabled selected>Select a Category</option>
                <option >Pottery</option>
                <option >Paint</option>
              </select>
          <li><textarea defaultValue=" " onChange={(e)=> setnewshopdescription(e.target.value) }/></li>
          <button type="button" onClick={sendtoadmin}>Submit to admin</button>
      </ul> 
  </form>)}
  </section>
  );
}
};
