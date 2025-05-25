import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import '../styles/displayproducts.css';
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../config/firebase";

export const  Displayproducts=()=>{
    // Fetch this user's shop id
    let shopid= localStorage.getItem('shopid'); 
    let navigate=useNavigate();
    
    // The default view is the dashboard
    function navigateDashboard(){
        navigate('/shopdashboard');
    }
    
    
const[store,setstore]=useState("");// This is to 
    // Fetch this user's shop id


const[products,setproducts]=useState([]);
const [loading ,setloading]=useState(false);


const getproducts = async () => {
  const functions = getFunctions(app);
  const getProductsInShop = httpsCallable(functions, "getProductsInShop");

  try {
    const result = await getProductsInShop({ shopid }); // shopid must be defined
    const productsFromCloud = result.data;

    console.log("Fetched products from Cloud Function:", productsFromCloud);
    setproducts(productsFromCloud); // set state with fetched data

  } catch (error) {
    console.error("Error calling Cloud Function:", error);
  }
};


    
useEffect(() => {
const fetchproducts=async()=>{
    setloading(true);
    const shopid = localStorage.getItem('shopid');
    if (shopid) {
      await getproducts();
    } else {
        console.log("Waiting for shop ID...");
    }
setloading(false);
};
fetchproducts();

}, [shopid]);


// Delete the product, navigate to removeproducts page
const Button_delete=(name,pid,purl)=>{
    const id = name;
    const productid=pid;
    const url=purl;
   if(id){
    console.log("The id of the button clicked is "+id);
   }else{
    console.log("Could not get the id of the button that was clicked.")
   }
   localStorage.setItem('Item',id);
   localStorage.setItem("producturl",url);
   localStorage.setItem('productid',productid);
    setstore(id);
    console.log(store);
    ///Log the items
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    navigate('/removeproducts');
    

};
// Update fields of a product, hence navigate to update page
const Button_update=(name,prid)=>{ 
   
    const id =name;   
    const productupdateid=prid;
   if(id){
    console.log("The id of the button clicked is "+id);
   }else{
    console.log("Could not get the id of the button that was clicked.")
   }
   localStorage.setItem('Item',id);
   localStorage.setItem('productupdateid',productupdateid);

    setstore(id);
    console.log(store);
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    navigate('/updateproducts');

};

// To add products navigate to addproducts page
const Button_add=()=>{
    navigate('/addproducts');
}



// Return the product and the fields, as well as the three CRUD buttons above
    return(<section className="disp-wrapper">
       <section className="disp-section">
            <section className="disp-section"><h1>My products</h1></section>
       
        
        <button className="dashboard-button-sd" onClick={navigateDashboard}>← Dashboard</button> {/*button to navitage to dasboard*/}
         {loading ? (<section>Loading...</section>):(
            <>
        {products.map((item)=>
        <section className="product"  key={item.name}>
           <img src={item.imageURL} alt={item.name}  width="200" height="auto" /><br/>
           {console.log(item.imageURL)}
           {console.log("Url is up there")}
           <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Description:</strong> {item.itemdescription}</p>
            <p><strong>Price:</strong> {item.price}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <button className="update-button-sd" onClick={()=>{Button_update(item.name,item.id)}}>Update Product</button>
            <button className="remove-button-sd" onClick={()=>{Button_delete(item.name,item.id,item.imageURL)}}>Remove Product</button>
            <br/><br/>

           
        </section>

        )}
        </>)}
   </section>
    
    <button className="add-button-sd" onClick={Button_add}>Add product</button>
    
    </section>
    );
    


}
