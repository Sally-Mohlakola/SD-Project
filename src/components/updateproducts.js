import { useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/updateproducts.css'
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";
import React from 'react';

// This is where we handle updating product details
export const Updateproduct=()=>{
    
    // For navigating back to products page
    let navigate=useNavigate();
    const Back=()=>{
      navigate('/displayproducts');
    };

    // Grabbing shop and product info from localStorage
    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    const productid=localStorage.getItem('productupdateid');
    
    // Just some console logs to check what we're working with
    console.log("productid:",productid);
    console.log("Have the item stored as "+Item)
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    
    // Setting up state for all the product fields we might update
    const[productname,setproductname]=useState("");
    const[description,setdescription]=useState("");
    const[price,setprice]=useState("");
    const[newquantity,setnewquantity]=useState("");
    const[image, setimage]=useState(null);
    
    // Helper function to convert image to base64 - needed for Firebase storage
    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

    // Handles updating the product image
    const Image= async(e)=>{
      e.preventDefault();
      const base64 = await toBase64(image); // Convert the image to base64
      const extension = image.name.split('.').pop(); // Get the file extension
      
      // Calling the Firebase cloud function
      const updateImage = httpsCallable(functions, "updateProductImage");
      try {
        const res = await updateImage({
          shopid:shopid,
          productId:productid,
          base64Image: base64,
          ext:extension
        });
        alert(res.data.message); // Show success message
        navigate("/displayproducts"); // Go back to products page
      } catch (err) {
        console.error("Error:", err);
        alert("Failed to upload image.");
      }
    };

    // Updating the product name
    const Name=async(e)=>{
      e.preventDefault();
      const updateProductName = httpsCallable(functions, "updateProductName");
      try {
        const result = await updateProductName({
          shopid: shopid,
          productId: productid,
          newName: productname
        });
        alert(result.data.message);
        navigate('/displayproducts');
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed!");
      }
    };

    // Updating the product description
    const Description=async(e)=>{
      e.preventDefault(); 
      const updateProductDescription = httpsCallable(functions, "updateProductDescription");
      try {
        const result = await updateProductDescription({
          shopid: shopid,
          productId: productid,
          newdescription: description
        });
        alert(result.data.message);
        navigate('/displayproducts');
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed!");
      }
    };

    // Handles updating the product price
    const Price=async(e)=>{
      e.preventDefault(); 
      const updateProductPrice = httpsCallable(functions, "updateProductPrice");
      try {
        const result = await updateProductPrice({
          shopid: shopid,
          productId: productid,
          newprice: price
        });
        alert(result.data.message);
        navigate('/displayproducts');
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed!");
      }
    };

    // Handles updating the product quantity
    const Setnewquantity=async(e)=>{
      e.preventDefault(); 
      const updateProductQuantity = httpsCallable(functions, "updateProductQuantity");
      try {
        const result = await updateProductQuantity({
          shopid: shopid,
          productId: productid,
          newquantity: newquantity
        });
        alert(result.data.message);
        navigate('/displayproducts');
      } catch (error) {
        console.error("Update failed:", error);
        alert("Update failed!");
      }
    };

    // The actual form UI
    return(
      <section className="updateprod-section">
        <section className="updateprod-heading"><h1>Update product</h1></section>
          
        <section className="inputs">
          {/* Each form handles a different product attribute */}
          <form onSubmit={Name}>
            <label htmlFor="name">Name of product:</label>
            <input id="name" type="text" required value={productname} onChange={(e)=>setproductname(e.target.value)} />
            <button type="submit">Update product name</button>
          </form>
          
          <form onSubmit={Description}>
            <label htmlFor="des">Description of the product:</label>
            <textarea id="des" type="text" required rows="6" cols="-40" value={description} onChange={(e)=>setdescription(e.target.value)}></textarea>
            <button type="submit">Update description</button>
          </form>

          <form onSubmit={Price}>
            <label htmlFor="price">Price:</label>
            <input id="price" type="number" min="1" max="50000" required value={price} onChange={(e)=>setprice(e.target.value)} />
            <button type="submit">Update price</button>
          </form>
        
          <form onSubmit={Setnewquantity}>
            <label htmlFor="quan">Quantity:</label>
            <input id="quan" type="number" min="1" max="50000" required value={newquantity} onChange={(e)=>setnewquantity(e.target.value)} />
            <button type="submit">Update quantity</button>
          </form>

          <form onSubmit={Image}>
            <input data-testid="image-input" type="file" id="image" accept="image/*" onChange={(e) => setimage(e.target.files[0])}/> 
            <button>Update image</button>
          </form>
        </section>
        
        {/* Back button to return to products list */}
        <button className='back-btn-up' onClick={Back}>← Back</button>
      </section>
    );
}