import React,{useState} from 'react'
import {db} from '../config/firebase.js'
import { collection, addDoc} from 'firebase/firestore';
//import { v4 as uuidv4 } from 'uuid';
//import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";


export const Addproduct=()=>{
        const[itemName,setitemname]=useState("");
        const[price,setprice]=useState("");
        const[quantity,setquantity]=useState("");
       // const[userid,setuserid]=useState(null);
      //  const [shopid, setshopid] = useState(null);
        const[itemdescription,setitemdescription]=useState("");
        
       // const[image, setimage]=useState(null);
       
      
      
  

        const handleSubmit = async(e) => {
            e.preventDefault(); 
          //  if (!image) {
             // alert("Please select an image!");
            //  return;
          //  }
          
            try {
           //   const uniqueName = uuidv4() + "-" + image.name;
           //   const imageRef = storageRef(storage, `products/${uniqueName}`);
             // console.log("Uploading image to:", imageRef.fullPath);
           //   await uploadBytes(imageRef, image);
           //   console.log("Image uploaded successfully.");
           //   const downloadURL = await getDownloadURL(imageRef);
           let userid= "uuuu"
          let shopid="1ORxGp4XzjJFESTjlrGJ";
              await addDoc(collection(db, "Shops", shopid,"Products"), {
                nameofitem: itemName,
                description:itemdescription,
                price: Number(price),
                quantity: Number(quantity),
            //    imageURL: downloadURL,
                timestamp: new Date(),
               
              });

              
              await addDoc(collection(db, "Products"), {
                nameofitem: itemName,
                description:itemdescription,
                price: Number(price),
                quantity: Number(quantity),
            //    imageURL: downloadURL,
                timestamp: new Date(),
                userID: userid
              });
              
              console.log("Items have been added successfully");
              setitemname("");
              setprice("");
              setquantity("");
              setitemdescription("");
              alert("Product have been added successfully!");

             // setimage(null);
            } catch (error) {
              console.log("Items were not added successfully", error);
            }
          };
   

    return (
        <section className="Box">
            <h1>Add items</h1>
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
                  { /* <label htmlFor="image">Upload image of item below:</label><br/> */}
                  {/* <input type="file" id="image" accept="image/*" onChange={(e) => setimage(e.target.files[0])}/> */}
                    

                </section>
                <button type="submit">Add Product</button>
            </form>
        </section>
    );


};




