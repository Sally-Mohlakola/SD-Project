import { docs,doc,where ,collection,query,getDocs,updateDoc} from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { useShopId } from "./userinfo";


export const Updateproduct=()=>{
    useShopId();
    let navigate=useNavigate();
    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    console.log("Have the item stored as "+Item)
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    //--------------------------------------------------------------------------
    const[productname,setproductname]=useState("");
    const[description,setdescription]=useState("");
    const[price,setprice]=useState("");
    const[addstock,setaddstock]=useState("");
    const[newquantity,setnewquantity]=useState("");
    //------------------------------------------------------------


const Name=async(e)=>{
    e.preventDefault(); 
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
    if(!snapshot.empty){
    const document=snapshot.docs[0];
    const docdata = doc(db, "Shops", shopid, "Products", document.id);

    try {
        await updateDoc(docdata, {
          name: productname 
        });
        console.log("Field updated successfully!");
        alert("Name of product has been updated successfully!");
      } catch (error) {
        console.error("Error updating field:", error);
      }
    }

};
//------------------------------------------------------------
const Description=async(e)=>{
    e.preventDefault(); 
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
    if(!snapshot.empty){
    const document=snapshot.docs[0];
    const docdata = doc(db, "Shops", shopid, "Products", document.id);

    try {
        await updateDoc(docdata, {
          itemdescription: description
        });
        alert("Description of product has been updated successfully to " +productname);
        console.log("Name has been changed");
      } catch (error) {
        console.error("Error updating Name:", error);
      }
    }

};
//------------------------------------------------------------
const Price=async(e)=>{
    e.preventDefault(); 
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
   
    if(!snapshot.empty){
        const document=snapshot.docs[0];
        const docdata = doc(db, "Shops", shopid, "Products", document.id);

    
    try {
        await updateDoc(docdata, {
            price: price
        });
        alert("Price of product has been updated successfully!");
        console.log("Price updated successfully!");
      } catch (error) {
        console.error("Error updating price:", error);
      }
    }
};
//------------------------------------------------------------
const Addstock=async(e)=>{
    e.preventDefault(); 
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
    if(!snapshot.empty){
    const document=snapshot.docs[0];
    const docdata = doc(db, "Shops", shopid, "Products", document.id);

    try {
        await updateDoc(docdata, {
          quantity:  document.data().quantity+ addstock
        });
        alert("Quantity has been updated successfully!");
      } catch (error) {
        console.error("Error updating field:", error);
      }
    }
};
//------------------------------------------------------------
const Setnewquantity=async(e)=>{
    e.preventDefault(); 
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
    if(!snapshot.empty){
    const document=snapshot.docs[0];
    const docdata = doc(db, "Shops", shopid, "Products", document.id);

    try {
        await updateDoc(docdata, {
          quantity: newquantity 
        });
        console.log("Quantity has been updated successfully!");
      } catch (error) {
        console.error("Error updating Quantity:", error);
      }
    }

};
//------------------------------------------------------------

const Done=()=>{
    navigate('/displayproducts');

};
//------------------------------------------------------------

const Back=()=>{
    navigate('/displayproducts');
};
//------------------------------------------------------------








return(
    <section>
        <h1>Update product</h1>
        <form onSubmit={Name} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
            <label>Name of product:</label>
            <input type="text" required value={productname} onChange={(e)=>setproductname(e.target.value)} />
            <button type="submit">Update product name</button>
        </form>
        <form onSubmit={Description} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
            <label>Description of the product:</label>
            <textarea type="text" required  rows="6" cols="-40"value={description} onChange={(e)=>setdescription(e.target.value)} ></textarea>
            <button type="submit">Update description</button>
        </form>
        <form  onSubmit={Price} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
            <label>Price:</label>
            <input type="text" required value={price} onChange={(e)=>setprice(e.target.value)} />
            <button type="submit">Update price</button>
        </form>
        <form onSubmit={Addstock} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
            <label>Add stock</label>
            <input type="number" required value={addstock} onChange={(e)=>setaddstock(e.target.value)} />
            <button type="submit">Add stock</button>
        </form>
        <form onSubmit={Setnewquantity} style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "10px" }}>
            <label>Set new quantity:</label>
            <input type="number" required value={newquantity} onChange={(e)=>setnewquantity(e.target.value)} />
            <button type="submit">set quantity</button>
        </form>
        <button onClick={Back}>Back</button>
        <button onClick={Done}>Done</button>
    </section>
);

};
