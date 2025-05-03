import React, { useEffect, useState } from "react";
import { useShopId} from "./userinfo";
import { db } from "../config/firebase";
import { collection,  getDocs,query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';



export const  Displayproducts=()=>{
    useShopId();
    let navigate=useNavigate();
    
    function navigateDashboard(){
        navigate('/shopdashboard');
    }
    
    
    const[store,setstore]=useState("");// This is to 
    
    let product_object=new Object();
    const[products,setproducts]=useState([]);
    

    
    const getproducts= async()=>{
        let product_array=[];

    
   
    
    product_object=new Object();
   
    
    
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
    setproducts(product_array);


  
}

let shopid= localStorage.getItem('shopid');
    
useEffect(() => {
    const shopid = localStorage.getItem('shopid');
    if (shopid) {
        getproducts();
    } else {
        console.log("Waiting for shop ID...");
    }
}, []);






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
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    navigate('/removeproducts');
    

};
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
const Button_add=()=>{
    navigate('/addproducts');
}







    return(<section className="Box">
       
        <h1>My products</h1>
        <button onClick={navigateDashboard}>← Back</button> {/*button to navitage to dasboard*/}
        {products.map((item)=>
        <section className="product"  key={item.Name} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
           <img src={item.ImageUrl} alt={item.Name}  width="200" height="auto" /><br/>
           {console.log(item.ImageUrl)}
           {console.log("Url is up there")}
            <h4>Name: {item.Name}</h4>&nbsp;&nbsp;
            <h4>Description:{item.Description}</h4>&nbsp;&nbsp;
            <h4>Price:{item.Price}</h4>&nbsp;&nbsp;
            <h4>Quantity:{item.Quantity}</h4>&nbsp;&nbsp;
            <button id={item.Name} onClick={Button_update}>Update Product</button>
            <button id={item.Name} onClick={Button_delete} >Remove Product</button><br/><br/>

        </section>

        )}
    
   
    
    <button onClick={Button_add}>Add product</button>
    
    </section>
    );
    


}
