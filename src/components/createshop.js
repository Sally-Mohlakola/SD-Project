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
const [shoplist,setShoplist]=useState([]);

const [newshopname,setnewshopname]=useState("");
const [newshopdescription,setnewshopdescription]=useState("");
const [submitted, setSubmitted] = useState(false);
const [category, setcategory] = useState("");
const [nameexists, setnameexists]=useState(false);
const [imageupload,setimageupload]=useState(null);
const [loading, setLoading] = useState(false);

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

    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file); // This gives us base64
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

//Once the user creates a shop send it to admin
const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    const sendtoadmin= async()=>{
        try{
          // If all fields are not filled in, don't submit the shop
          if (!imageupload || !newshopname || !newshopdescription || !category ){
            alert('Please complete all fields before submitting ');
            return;
          }
          setLoading(true);
          const base64Image = await toBase64(imageupload);
          const extension = imageupload.name.split('.').pop();
          const functions = getFunctions();
          const createShop = httpsCallable(functions, 'createShop'); 
          const result = await createShop({userid:currentUserId,nameofshop:newshopname,description:newshopdescription,status:"Awaiting",category:category,image: base64Image.split(',')[1],ext:extension});
        if (result){
          setSubmitted(true); 
        }  
        else{
          setSubmitted(true); 
          alert("not submitted due to some internal error");
        }
        }catch(err){
          console.error(err);
          } finally {
  setLoading(false); 
            }
          
        
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
const backhome=()=>{
  navigate('/homepage');
}
return (
  <section className="create-shop">
    <h1>Creating my Shop</h1>

    {/* Show loading state */}
    {loading ? (
      <p className="shop-alert" >Submitting your shop...</p>
    ) : submitted ? (
      <section>
      <p className="shop-alert" >Your shop has been sent to admin</p>
       <button onClick={backhome}>Home</button>
      </section>
    ) : (
      <form>
        <p>
          <p><label htmlFor="shop-name">Name of shop</label></p>
          <p>
            <input
              id="shop-name"
              type="text"
              onChange={(e) => {
                setnewshopname(e.target.value);
                checkshopname(e.target.value);
              }}
            />
          </p>

          <p>
            <label htmlFor="shop-category">Category:</label>
            <p>
              <select
                id="shop-category"
                defaultValue=""
                onChange={(e) => {
                  setcategory(e.target.value);
                }}
              >
                <option value="" disabled>
                  Select a Category
                </option>
                <option>Pottery</option>
                <option>Paint</option>
                <option>Leatherwork</option>
                <option>Woodworking</option>
                <option>Weaving</option>
                <option>Metalwork</option>
                <option>Jewelry</option>
                <option>Knitting</option>
              </select>
            </p>
          </p>

          <p>
            <p><label htmlFor="shop-desc">Shop description</label></p>
            <textarea
              id="shop-desc"
              defaultValue=" "
              onChange={(e) => setnewshopdescription(e.target.value)}
            />
          </p>

          <p><label htmlFor="shop-img">Add logo/image:</label></p>
          <p>
            <input
              id="shop-img"
              type="file"
              onChange={(e) => setimageupload(e.target.files[0])}
            />
          </p>

          <button
            type="button"
            onClick={() => {
              if (nameexists) {
                alert("A store with that name exists");
              } else {
                sendtoadmin();
              }
            }}
          >
            Submit to admin
          </button>
        <button onClick={backhome}>Cancel</button>

        </p>
      </form>
    )}
  </section>
);

}
