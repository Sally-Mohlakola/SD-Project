import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import '../styles/removeproducts.css'
import { getFunctions, httpsCallable } from 'firebase/functions';


export const DeleteProduct=()=>{

    let navigate=useNavigate();
    const [loading ,setloading]=useState(false);
    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    const productid=localStorage.getItem('productid');
    const producturl =localStorage.getItem('producturl');
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

function getStoragePathFromUrl(iurl) {
  try {
    const decodedUrl = decodeURIComponent(iurl);
    const startIndex = decodedUrl.indexOf("/o/") + 3;
    const endIndex = decodedUrl.indexOf("?alt=");
    return decodedUrl.substring(startIndex, endIndex);
  } catch (e) {
    return null;
  }
}
console.log("path",producturl);
console.log("productid",productid);

const delete_item= async()=>{
setloading(true);
try{
        const functions = getFunctions();

        const deleteProduct = httpsCallable(functions, 'deleteProduct');
        const filepath = getStoragePathFromUrl(producturl);
        console.log("path",filepath);
        await deleteProduct({shopId:shopid, productId:productid ,path:filepath});
}catch(err){
    console.log(err);
}finally{
    setloading(false);
}



navigate('/displayproducts');


}


    
    const Back=()=>{
        navigate('/displayproducts');
    
       }



   return(
        <section className="Wrap">
            <section className="delete_wrapper">



            <section className="back-button-delete">
            <button  onClick={Back}><i className="bx bx-x"></i>Close</button>
            </section>

           
            <section className="myicon"><i className="bx bx-trash"></i> </section>
           

           {loading ? (<p>Loading...</p>):(
            <>
            <section className="H2">
            <h1>Do you want to remove this product?</h1><br/>
            </section>

            <section className="H1">
            <h1>{Item}</h1>
            </section>

            <section className="delete_button-dp">
            <button onClick={delete_item}>Confirm</button>
            </section>
            
 </>
            )}
            </section>
            </section>
           
    );

};
