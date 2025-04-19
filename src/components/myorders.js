import{ useState,useEffect } from 'react';
//import { useNavigate } from "react-router-dom";
//import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection,updateDoc,doc} from "firebase/firestore"

 

export const MyOrders =()=>{
const [orderlist,setorderlist]=useState([]);
const currentUserId = localStorage.getItem("userid");
const currentuserstore= localStorage.getItem("shopname");
const ordercollectionRef=collection(db,"Orders");
//console.log( "shopname of user ",currentuserstore);
useEffect(()=>{
    const getorderlist= async()=>{
        try{
        const data=await getDocs(ordercollectionRef);
        const filterddata = await Promise.all( 
            data.docs.map(async(doc) =>{
            const orderData = doc.data();
            const productsSnapshot = await getDocs(collection(doc.ref, "Products"));
            const products = productsSnapshot.docs.map((itemDoc) => itemDoc.data());
            return({
            orderid:doc.id,
            ...orderData,
            nameofshop: doc.data().nameofshop,
            address: doc.data().address,
            status: doc.data().status,
          
            products: products
        });
        })
      );
        setorderlist(filterddata);
        }catch(err){
            console.error(err);
        }
    };
    getorderlist();
},[]);

const myorders = orderlist.filter((order) => order.nameofshop===currentuserstore);

const [orderstatus,setorderstatus]=useState("");
const [pressed,setpressed]=useState(false);


const update=async ()=>{
try{
setpressed(true);
}catch(err){
      console.error(err);
}
};

const updatestatus=async (ordid)=>{
      try{
      setpressed(false);
      console.log(orderstatus,ordid);
      const orderRef = doc(db, "Orders", ordid); 
      await updateDoc(orderRef, {
            status: orderstatus
            
      })
 
     }catch(err){
            console.error(err);
      }
      };



    return(

      <section>
       {myorders.map((ord,index)=>(
            
             <section key={index}>
                   <p>Address:{ord.address}</p>
                   {pressed? (
                        <section>
                        
                        <select onChange={(e)=> setorderstatus(e.target.value)}>
                              <option>Delivery ready</option>
                             <option>Dispatched</option>
                             <option>Ordered</option>
                        </select>
                        <button onClick={() => {
                              updatestatus(ord.orderid);
                                       }}>Save</button>
                        
                         </section>
                   ) :(
                  <>
                        <li>
                   Status: {ord.status}   
                    <button onClick={update}>  Update status</button>
                   </li>
                   </>
                   )}
                  
                  {ord.products.map((prod, index2) => (
                  <section key={index2}>
                        <p>Name:{prod.nameofitem}</p>
                        <p>Quantity:{prod.quantity}</p>
                        <p>R{prod.price}</p>
                  </section>
                  
                  ))}
                       
             </section> ))}
             <nav>  <li><Link to="/trends">Download trends</Link></li></nav>
            
       </section>
  
    );
   };