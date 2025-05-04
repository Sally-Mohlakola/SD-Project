import React, { useEffect, useState } from "react";
import { useShopId} from "./userinfo";
import { db } from "../config/firebase";
import { collection,  getDocs,query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CsvDownloader from 'react-csv-downloader';


// To view the inventory of items sold.
export const  Inventory=()=>{
    useShopId();
    let navigate=useNavigate();

    function navigateDashboard(){
        navigate("/shopdashboard");
    }
    const low_limit=5; // This is for when the product has a quantity of less than the low limit it should tell the seller
    
    
    const[store,setstore]=useState("");// This is to 
    
    let product_object=new Object();
    let restock_object=new Object();
    const[products,setproducts]=useState([]);
    const[restock,setrestock]=useState([]);
    
    
    const getproducts= async()=>{
        let product_array=[];
        let restock_array=[];

    
   
    
    product_object=new Object();
    restock_object=new Object();
   
    
    // Get the fields for each product from the database
    const q= query(collection(db,"Shops",shopid,"Products"));
    const snapshot=await getDocs(q);
    snapshot.forEach((doc)=>{
        let data=doc.data();
        console.log(data.itemName);
        console.log("Mark 1");
        product_object.ImageUrl=data.imageURL;
        product_object.Name=data.name;
        product_object.Sold=data.sold;
        product_object.Price=data.price;
        product_object.Quantity=data.quantity;
        product_array.push(product_object);
        product_object=new Object();

        //Alerts seller if items are reaching a low limit so they have to restock
        if(data.quantity < low_limit ){
            console.log("mARK 2");
            restock_object.Name=data.name;
            restock_object.Sold=data.sold;
            restock_object.Quantity=data.quantity;
            restock_array.push(restock_object);
            console.log("Restock: "+restock_object.Name +restock_object.Quantity);
            restock_object= new Object();

        }
        console.log("Product in object");


    
    })
    setrestock(restock_array);
    setproducts(product_array);


  
}

const shopid = localStorage.getItem('shopid');
 // This use effect ensures that products get returned only if there is a valid shopID recorded for the user   
useEffect(() => {
    //const shopid = localStorage.getItem('shopid');
    if (shopid) {
        getproducts();
    } else {
        console.log("Waiting for shop ID...");
    }
}, []);











//Diplay data from the fetched fields
    return(<section className="Box">
      
        <h1>Inventory</h1>
        <button onClick={navigateDashboard}>← Dashboard</button>
        {!restock || restock.length === 0 ? null : (

        <section style={{marginBottom: "10px", padding: "10px" }}>{/*This is to warn the seller to restock when there's this items left */}
        
        
        <section style={{ display: "flex", alignItems: "center", gap: "10px"}}>
        <img src="https://img.icons8.com/?size=96&id=5tH5sHqq0t2q&format=png" alt="warning sign" style={{ width: '20px', height: '20px' }}></img>
        <h3>Warning!! You might want to stock up on these:</h3>
        
        </section>
        
        
        {restock.map((value)=>
        <section key={value.Name} >
           <p>"{value.Name}" is running low(Only {value.Quantity} is left in stock)</p>
           
           
           
        </section>

        )}
           

        
        
        </section>
        )}
        
        {products.map((item)=>
        <section className="product"  key={item.Name} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px", padding: "10px"  }}>
           <img src={item.ImageUrl} alt={item.Name}  width="200" height="auto" /><br/>
           
           
            <h2>Name:</h2><h3> {item.Name}</h3><br/>

            <h2>Price:</h2><h3>{item.Price}</h3><br/>


            <h2>Quantity:</h2><h3>{item.Quantity}</h3><br/>

            <h2>Sold:</h2><h3>{item.Sold}</h3><br/>
           
        </section>

        )}
    <CsvDownloader
  filename="Inventory_items"
  
  datas={products}
  text="Download Inventory CSV"
/>

    
    </section>
    
    );
    


};
