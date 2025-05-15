
import React, { useState,useEffect } from 'react';
//import { useNavigate } from "react-router-dom";
//import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection,deleteDoc ,doc} from "firebase/firestore"
import { useNavigate } from "react-router-dom";




export const MyShop=()=>{
  const [isReady, setIsReady] = useState(false);
    const [loading, setLoading] = useState(true);
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
           id:doc.id,
            ...doc.data(), 
            userid: doc.data().userid,
            nameofshop: doc.data().nameofshop,
            description: doc.data().description,
            status: doc.data().status
          }));
        setShoplist(filterddata);
        setLoading(false);
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
  if (!loading && shoplist.length > 0) {
    const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    if (userShop) {
      setstore(userShop);
      setIspublic(userShop.status);
    }
    setIsReady(true); // Now we know what to show
  
    };
    
  }, [shoplist, currentUserId,loading]);

  useEffect(() => {
    if (ispublic === "Accepted") {
      navigate("/shopdashboard");
    }
  }, [ispublic, navigate]);

  
//start newshop by navagating to newpage 
const startshop=()=>{
  navigate('/createshop');
};

const deleterejectedshop =async (id)=>{
  try{
   const rejectedshop=doc(db,"Shops",id);
  await deleteDoc(rejectedshop);
  }catch(err){
    console.error(err);
  }
};

if (loading || !isReady) return <section></section>;

if (ispublic==="Rejected"){
  return(
  <section>
  <h2>Your request to open a  store was rejected,You need try again </h2>
  <button onClick={()=>{
    deleterejectedshop(store.id);
    navigate("/createshop") }}>Apply to open shop again</button>
  </section>
  )
}

console.log(store.id);
if (store=="" ) {
  return (
    <section>
  <h1>You dont have a shop yet</h1>
  
    <button onClick={startshop}>Start my shop?</button>
    
    </section>
  )
  }
//if the store has been cleared by admin they must go to thier store


  // if the users store has not been cleared by admin
if (ispublic==="Awaiting"){
  return (
    <section>
    <h1>The admin has not cleared your store yet!</h1>
    <Link to="/homepage">Home</Link>
    </section>
    
  );
}


//if the user has no store they must create one 

};
