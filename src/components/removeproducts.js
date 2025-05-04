import { doc, deleteDoc,where ,collection,query,getDocs} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { useShopId } from "./userinfo";


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
        <section className="Box">
            <h1>Do you want to remove "{Item}"</h1>
            <section className="Buttons">
            <button onClick={Back}>Back</button>
            <button onClick={delete_item}>Confirm</button>
            </section>


        </section>
    );

};