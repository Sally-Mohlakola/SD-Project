import React, { useState,useEffect } from 'react';
import {db} from "../config/firebase";
import {collection,addDoc,getDocs} from "firebase/firestore"
import { Link,useNavigate } from "react-router-dom";
 
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
useEffect(()=>{
    const getshoplist= async()=>{
        try{
        const data=await getDocs(shopcollectionRef);
        const filterddata = data.docs.map((doc) => ({
           id:doc.id,
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
const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    const sendtoadmin= async()=>{
        try{
            await addDoc(shopcollectionRef,{userid:currentUserId,nameofshop:newshopname,description:newshopdescription,status:"Awaiting",category:category})
          }catch(err){
          console.error(err);
          };
          setSubmitted(true); 
        
        };
const checkshopname=(shops)=>{
  const userShop = shoplist.find((shop) => shop.nameofshop === shops);
  if (userShop){
  setnameexists(true);
  }
};
    return (

        <section>
        <h1>My Shop</h1>
        {/*this "submitted" checks if the person pressed the button to submit thier store to the admin" */}
        {submitted? (
            <section>
        <p>Your shop has been sent to admin</p>
            <Link to="/homepage">Home</Link>
            </section>
        ):(
            <form>
              <ul>
                <li><label>Name of shop</label></li>
                <li><input type="text" onChange={(e)=> {setnewshopname(e.target.value);checkshopname(e.target.value);}} /></li>
                <li><label>Shop description</label></li>
                <label>Category:</label>
                    <select onChange={(e)=>{setcategory(e.target.value)}}>
                    <option value="" disabled selected>Select a Category</option>
                      <option >Pottery</option>
                      <option >Paint</option>
                    </select>
                <li><textarea defaultValue=" " onChange={(e)=> setnewshopdescription(e.target.value) }/></li>
                <button type="button" onClick={()=>{
                  if(nameexists){
                      alert("A store with that name exists");
                    }
                  else{
                  sendtoadmin();
                }
                }}>Submit to admin</button>
            </ul> 
        </form>)}
   
        </section>
        );
}