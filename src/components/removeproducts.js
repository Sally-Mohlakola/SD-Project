import { doc, deleteDoc,where ,collection,query,getDocs} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import '../styles/removeproducts.css'
import { useShopId } from "./userinfo";
import React from "react";


export const DeleteProduct=()=>{
    useShopId();
    let navigate=useNavigate();
    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    console.log("Have the item stored as "+Item)
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
   // localStorage.setItem('Item',"");
   useEffect(() => {
       let intervalId = setInterval(() => {
           if(Item){
               clearInterval(intervalId);
               console.log("Item catured");
               
              
           }else{
               console.log("still waiting foritem");

               
       
           }
         },5000);
     
      
   }, []); 

   const delete_item= async()=>{
    const productsRef = collection(db, "Shops", shopid, "Products");
const q = query(productsRef, where("name", "==", Item));

const querySnapshot = await getDocs(q);
if (!querySnapshot.empty) {
const document = querySnapshot.docs[0]; 
const docRef = doc(db, "Shops", shopid, "Products", document.id);
await deleteDoc(docRef);
}



navigate('/displayproducts');


}

    
    const Back=()=>{
        navigate('/displayproducts');
    
       }



    return(
        <section className="Wrap">
            <section className="delete_wrapper">



            <section className="back_button">
            <button  onClick={Back}><i className="bx bx-x"> close</i></button>
            </section>

           
            <section className="myicon"><i className="bx bx-trash"></i> </section>
           

            <section className="H2">
            <h1>Do you want to remove</h1><br/>
            </section>

            <section className="H1">
            <h1>{Item}</h1>
            </section>

            <section className="delete_button">
            <button onClick={delete_item}>Confirm</button>
            </section>
            

            </section>
            </section>
           
    );

};
