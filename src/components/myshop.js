import React, { useState,useEffect } from 'react';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection,addDoc} from "firebase/firestore"
import { useNavigate } from "react-router-dom";


export const MyShop=()=>{
    const navigate = useNavigate();

    const currentUserId = localStorage.getItem("userid");
    const [shoplist,setShoplist]=useState([]);
    const shopcollectionRef=collection(db,"Shops");

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




   


const [ispublic, setIspublic] = useState(false);
const [store, setstore] = useState("");



useEffect(() => {
    const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    if(userShop){
    setstore(userShop);
    setIspublic(userShop.status); 
    };
 
  }, [shoplist, currentUserId]);
//new states states 
const [newshopname,setnewshopname]=useState("");
const [newshopdescription,setnewshopdescription]=useState("");
const [submitted, setSubmitted] = useState(false);

const sendtoadmin= async()=>{
try{
    await addDoc(shopcollectionRef,{userid:currentUserId,nameofshop:newshopname,description:newshopdescription,status:false})
  }catch(err){
  console.error(err);
  };
  setSubmitted(true); 
};

  if (!store) {
    return (

    <section>
    <h1>My Shop</h1>
    {submitted? (
    <p>Your shop has been sent to admin</p>
    ):(
        <form>
          <ul>
            <li><label>Name of shop</label></li>
            <li><input type="text" onChange={(e)=> setnewshopname(e.target.value)} /></li>
            <li><label>Shop description</label></li>
            <li><textarea defaultValue=" " onChange={(e)=> setnewshopdescription(e.target.value) }/></li>
            <button type="button" onClick={sendtoadmin}>Submit to admin</button>
        </ul> 
    </form>)}
    </section>
    );
  }

  if (ispublic) {
    navigate("/shophomepage");
    return null;
  }

  return (
    <p>The admin has not cleared your store yet!</p>
  );
};
