import React, { useEffect, useState } from "react";
import { useShopId} from "./userinfo";
import { db } from "../config/firebase";
import { collection,  getDocs,query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/displayproducts.css';


export const  Displayproducts=()=>{
    useShopId();
    let navigate=useNavigate();
    
    // The default view is the dashboard
    function navigateDashboard(){
        navigate('/shopdashboard');
    }
    
    
    const[store,setstore]=useState("");// This is to 
    
    let product_object=new Object();
    const[products,setproducts]=useState([]);

    
    const getproducts= async()=>{
        let product_array=[];
    
    product_object=new Object();
   
    
    // Fetch all revelant products by this user from the storage
    const q= query(collection(db,"Shops",shopid,"Products"));
    const snapshot=await getDocs(q);
    snapshot.forEach((doc)=>{
        let data=doc.data();
        console.log(data.itemName);
        product_object.ImageUrl=data.imageURL;
        product_object.Name=data.name;
        product_object.Description=data.itemdescription;
        product_object.Price=data.price;
        product_object.Quantity=data.quantity;
        product_array.push(product_object);
        product_object=new Object();
        console.log("Product in object");


    
    })
    // allocated this to an array for later manipulations
    setproducts(product_array);

}

// Fetch this user's shop id
let shopid= localStorage.getItem('shopid');
    
useEffect(() => {
    const shopid = localStorage.getItem('shopid');
    if (shopid) {
        getproducts();
    } else {
        console.log("Waiting for shop ID...");
    }
}, []);

// Delete the product, navigate to removeproducts page
const Button_delete=(e)=>{
    const id = e.target.id;
   if(id){
    console.log("The id of the button clicked is "+id);
   }else{
    console.log("Could not get the id of the button that was clicked.")
   }
   localStorage.setItem('Item',id);
    setstore(id);
    console.log(store);
    ///Log the items
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    navigate('/removeproducts');
    

};
// Update fields of a product, hence navigate to update page
const Button_update=(e)=>{ 
   
    const id = e.target.id;
   if(id){
    console.log("The id of the button clicked is "+id);
   }else{
    console.log("Could not get the id of the button that was clicked.")
   }
   localStorage.setItem('Item',id);
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
        {products.map((item)=>
        <section className="product"  key={item.Name}>
           <img src={item.ImageUrl} alt={item.Name}  width="200" height="auto" /><br/>
           {console.log(item.ImageUrl)}
           {console.log("Url is up there")}
           <p><strong>Name:</strong> {item.Name}</p>
            <p><strong>Description:</strong> {item.Description}</p>
            <p><strong>Price:</strong> {item.Price}</p>
            <p><strong>Quantity:</strong> {item.Quantity}</p>
            <button className="update-button-sd" id={item.Name} onClick={Button_update}>Update Product</button>
            <button className="remove-button-sd" id={item.Name} onClick={Button_delete}>Remove Product</button>
            <br/><br/>

           
        </section>

        )}
    
   </section>
    
    <button className="add-button-sd" onClick={Button_add}>Add product</button>
    
    </section>
    );
    


}
