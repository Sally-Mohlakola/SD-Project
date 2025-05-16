import React, { useState,useEffect } from 'react';
import {db} from "../config/firebase";
import {collection,addDoc,getDocs} from "firebase/firestore"
import { Link,useNavigate } from "react-router-dom";
import { storage } from '../config/firebase';
import {ref,uploadBytes} from "firebase/storage";
import '../styles/createShop.css';
import { getFunctions, httpsCallable } from 'firebase/functions';
export const Createshop=()=>{

const navigate = useNavigate();
const currentUserId = localStorage.getItem("userid");
const shopcollectionRef=collection(db,"Shops");
const [shoplist,setShoplist]=useState([]);

const [newshopname,setnewshopname]=useState("");
const [newshopdescription,setnewshopdescription]=useState("");
const [submitted, setSubmitted] = useState(false);
const [category, setcategory] = useState("");
const [nameexists, setnameexists]=useState(false);
const [imageupload,setimageupload]=useState(null);
 
//Get a list of all shops
useEffect(()=>{
    const getshoplist= async()=>{
        try{
                const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        setShoplist(result.data.shops);
        }catch(err){
            console.error(err);
        }
    };
    getshoplist();
},[]);
//Once the user creates a shop send it to admin
const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    const sendtoadmin= async()=>{
        try{
          // If all fields are not filled in, don't submit te shop
          if (!imageupload || !newshopname || !newshopdescription || !category ){
            alert('Please complete all fields before submitting ');
            return;
          }
          const extension = imageupload.name.split('.').pop();
          const path=`${currentUserId}.${extension}`;
           const imageref=ref(storage,`Shop/${path}`);
           uploadBytes(imageref,imageupload);
           await addDoc(shopcollectionRef,{userid:currentUserId,nameofshop:newshopname,description:newshopdescription,status:"Awaiting",category:category,imageurl:path})
            
          }catch(err){
          console.error(err);
          };
          setSubmitted(true); 
        
        };
        //Prevent shops with Duplicate names
const checkshopname=(shops)=>{
  const userShop = shoplist.find((shop) => shop.nameofshop === shops);
  if (userShop){
  setnameexists(true);
  }
  else{
    setnameexists(false);
  }
};

    return (

        <section className="create-shop">
        <h1>Creating my Shop</h1>
        {/*this "submitted" checks if the person pressed the button to submit their store to the admin" */}
        {submitted? (
            <section>
        <p>Your shop has been sent to admin</p>
            <Link to="/homepage">Home</Link>
            </section>
        ):(
            <form>
              <p>
                
                <p><label htmlFor="shop-name">Name of shop</label></p>
                <p><input id="shop-name" type="text" onChange={(e)=> {setnewshopname(e.target.value);checkshopname(e.target.value);}} /></p>
              
                <p><label htmlFor="shop-category">Category:</label>
                    <p><select id="shop-category" onChange={(e)=>{setcategory(e.target.value)}}>
                    <option value="" disabled selected>Select a Category</option>
                      <option >Pottery</option>
                      <option >Paint</option>
                    </select></p>
                    </p>   
                <p>
                <p><label htmlFor="shop-desc">Shop description</label></p>
                <textarea id="shop-desc" defaultValue=" " onChange={(e)=> setnewshopdescription(e.target.value) }/></p>
                <p><label htmlFor="shop-img">Add logo/image:</label></p>
                <p><input  id="shop-img"type="file" onChange={(e)=> setimageupload(e.target.files[0]) }/></p>
                <button type="button" onClick={()=>{
                  if(nameexists){
                      alert("A store with that name exists");
                    }
                  else{
                  sendtoadmin();
                }
                }}>Submit to admin</button>
            </p> 
        </form>)}
   
        </section>
        );
}
