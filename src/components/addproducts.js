import React,{useState} from 'react'
import { useShopId } from './userinfo.js';
import {db, storage} from '../config/firebase.js';
import { collection, addDoc} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import '../styles/addproduct.css';

export const Addproduct=()=>{
  const navigate=useNavigate();
    
      useShopId();
      // get this user's shop id to query the database with
      let shopid=localStorage.getItem('shopid');
        const[itemName,setitemname]=useState("");
        const[price,setprice]=useState("");
        const[quantity,setquantity]=useState("");
       // const[userid,setuserid]=useState(null);
      //  const [shopid, setshopid] = useState(null);
        const[itemdescription,setitemdescription]=useState("");
        
        const[image, setimage]=useState(null);
       
      //Submit all fields to storage, make sure that they are non-empty
        const handleSubmit = async(e) => {
            e.preventDefault(); 
            if (!image || !itemName || !price || !quantity || !itemdescription) {
              alert("Please fill in the required fields");
              return;
            }
          
            // mechanism for uploading the images
            try {
              const uniqueName = uuidv4() + "-" + image.name;
              const imageRef = storageRef(storage, `products/${uniqueName}`);
              console.log("Uploading image to:", imageRef.fullPath);
              await uploadBytes(imageRef, image);
              console.log("Image uploaded successfully.");
              const downloadURL = await getDownloadURL(imageRef);
           
              // at the document to storage of all the updated fields (the default for sold is always 0 for newly created items)
              await addDoc(collection(db, "Shops", shopid,"Products"), {
                name: itemName,
                itemdescription:itemdescription,
                price: Number(price),
                quantity: Number(quantity),
                sold:0, // default number
                imageURL: downloadURL
               // timestamp: new Date(),
               
              });

              
              
              // Alerts to notify the seler that their updates are recorded
              console.log("Items have been added successfully");
              setitemname("");
              setprice("");
              setquantity("");
              setitemdescription("");
              alert("Your Product has been added successfully!");
              navigate('/displayproducts'); // after alert, rediret user to the default display view (intuitive to want to see the update displayed on screen)
              setimage(null);
            } catch (error) {
              console.log("Items were not added successfully", error);
            }
          };
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
                    <input type="number" id="price" min="0" placeholder='(in rands)' required value={price} onChange={e=>setprice(e.target.value)}/><br/>
                    <label htmlFor="quantity">Quantity</label>
                    <input type="number" id="quantity" min="0" placeholder="e.g. 8" required value={quantity} onChange={e=>setquantity(e.target.value)}/><br/>
                   <label htmlFor="image">Upload image of item below:</label><br/> 
                  <input type="file" id="image" accept="image/*" onChange={(e) => setimage(e.target.files[0])}/> 
                    
                  {/*Make sure that no product lacks an image*/}
                </section>
                <section className='addbutton-wrapper'>
                <button className="submit-button" type="submit" onClick={handleSubmit}>Add Product</button>
                </section>
            </form>
            <button className="back-button-add" onClick={Back}>← Back</button>
            
        </section>
    );


};
