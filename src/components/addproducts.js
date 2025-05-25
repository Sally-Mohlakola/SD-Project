import React,{useState} from 'react'
import {db, storage} from '../config/firebase.js';
import { collection, addDoc} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import '../styles/addproduct.css';

//allows a shop owner to add products to their own shop
export const Addproduct=()=>{
  const navigate=useNavigate();
    
      // get this user's shop id to query the database with
      let shopid=localStorage.getItem('shopid');

      //stores form input values
        const[itemName,setitemname]=useState("");
        const[price,setprice]=useState("");
        const[quantity,setquantity]=useState("");
        const[itemdescription,setitemdescription]=useState("");        
        const[image, setimage]=useState(null);
      
      //Submit all fields to storage, make sure that they are non-empty
        const handleSubmit = async(e) => {
            e.preventDefault(); 

            // Basic front-end notification system for the seller (input validation)
            if (!image || !itemName || !price || !quantity || !itemdescription) {
              alert("Please fill in the required fields");
              return;
            }
            
            //Price of item validation
              if (price > 99999 || price < 1) {
                alert("Price must be between 1 and 99,999 Rands.");
                
                  return;
                }

            //Quantity of item validation
              if (quantity > 10000 || price < 1) {
                alert("Item quantity must be below 10,000");
                  return;
                }

            // mechanism for uploading the images
            try {
              const uniqueName = uuidv4() + "-" + image.name; //create unique name for image
              const imageRef = storageRef(storage, `products/${uniqueName}`);

              //Console log for image file location on the storage bucket
              console.log("Uploading image to:", imageRef.fullPath);

              //Upload image to Firebase sotrage
              await uploadBytes(imageRef, image);
              console.log("Image uploaded successfully.");
              const downloadURL = await getDownloadURL(imageRef);
           
              //add the data entry to storage of all the updated fields (the default for sold is set to 0 for newly created items)
              await addDoc(collection(db, "Shops", shopid,"Products"), {
                name: itemName,
                itemdescription:itemdescription,
                price: Number(price),
                quantity: Number(quantity),
                sold:0, // default count
                imageURL: downloadURL               
              });

              // Log the adding an item to storage status
              console.log(itemName,": item is stored successfully");

              setitemname("");
              setprice("");
              setquantity("");
              setitemdescription("");

              // Alerts to notify the seller that their updates are recorded
              alert("Your product has been added successfully!");
              navigate('/displayproducts'); // after alert, redirect the user to the default display view (intuitive to want to see the update displayed on screen)
              setimage(null);
            } catch (error) {
               // Log the adding an item to storage status
              console.log(itemName, ": item is not stored successfully. Error: ", error);
            }
          };

        //navigate to previous page
          const Back=()=>{
            navigate('/displayproducts');
           }

           // return a form with all fields that can be altered
       return (
        <section className="addprod-section">
          <section className='addprod-heading'><h1>Add products</h1></section>
            <form onSubmit={handleSubmit}>
                <section className="inputs">
                    <label htmlFor="itemName">Item:</label>
                    <input type="text" id="itemName" placeholder='Enter name of product' required value={itemName} onChange={e=>setitemname(e.target.value)}/><br/>
                    <label htmlFor="itemdescription">Description:</label>
                    <textarea
                            id="itemdescription"
                            placeholder="Describe the product"
                            rows="6"
                            cols="40"
                            value={itemdescription}
                            onChange={e => setitemdescription(e.target.value)}
>                   </textarea>

                    <label htmlFor="price">Price:</label>
                    <input type="number" id="price" min="1" max="99999" placeholder='(in rands)' required value={price} onChange={e=>setprice(e.target.value)}/><br/>
                    <label htmlFor="quantity">Quantity</label>
                    <input type="number" id="quantity" min="1" max="10000" placeholder="e.g. 8" required value={quantity} onChange={e=>setquantity(e.target.value)}/><br/>
                   <label htmlFor="image">Upload image of item below:</label><br/> 
                  <input type="file" id="image" accept="image/*" required onChange={(e) => setimage(e.target.files[0])}/> 
                    
                  {/*Make sure that no product lacks an image before upload*/}
                </section>
                <section className='addbutton-wrapper'>
                <button className="submit-button" type="submit" onClick={handleSubmit}>Add Product</button>
                </section>
            </form>
            <button className="back-button-add" onClick={Back}>← Back</button>
            
        </section>
    );
};
