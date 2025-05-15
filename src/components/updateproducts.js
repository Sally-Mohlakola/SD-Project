import { docs,doc,where ,collection,query,getDocs,updateDoc} from "firebase/firestore";
import { db,storage } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/updateproducts.css'
import { useShopId } from "./userinfo";
import { v4 as uuidv4 } from 'uuid';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";




export const Updateproduct=()=>{
    useShopId();
    let navigate=useNavigate();

    const Back=()=>{
      navigate('/displayproducts');
  };

    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    console.log("Have the item stored as "+Item)
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    //--------------------------------------------------------------------------
    const[productname,setproductname]=useState("");
    const[description,setdescription]=useState("");
    const[price,setprice]=useState("");
    
    const[newquantity,setnewquantity]=useState("");
    const[image, setimage]=useState(null);
    //------------------------------------------------------------
  const Image= async(e)=>{
    e.preventDefault();
    const q= query(collection(db,"Shops",shopid,"Products"),where("name","==",Item));
    const snapshot=await getDocs(q);
    let docdata
    if(!snapshot.empty){
    const document=snapshot.docs[0];
    docdata = doc(db, "Shops", shopid, "Products", document.id);
    }
    
    try{
      const uniqueName = uuidv4() + "-" + image.name;
              const imageRef = storageRef(storage, `products/${uniqueName}`);
              console.log("Uploading image to:", imageRef.fullPath);
              await uploadBytes(imageRef, image);
                            
              console.log("Image uploaded successfully.");
              const downloadURL = await getDownloadURL(imageRef);
              await updateDoc(docdata, {
                imageURL : downloadURL 
              });
              console.log("Field updated successfully!");
              alert("Your image has been updated successfully!");
              navigate('/displayproducts');

    }catch(error){
      console.log(error);

    }



  }







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
        navigate('/displayproducts');
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
        alert("Description of product has been updated successfully to '" +description + "'");
        console.log("Name has been changed");
        navigate('/displayproducts');
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
        navigate('/displayproducts');
      } catch (error) {
        console.error("Error updating price:", error);
      }
    }
};
//------------------------------------------------------------

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
        alert("New quantity has been updated successfully!");
        console.log("Quantity has been updated successfully!");
        navigate('/displayproducts');
      } catch (error) {
        console.error("Error updating Quantity:", error);
      }
    }

};
//------------------------------------------------------------


return(
  <section className="Body">
    <section className="left">

  <h1>Update product</h1>
  <button onClick={Back}>← Back</button>
      </section>
      <section className="right">
      <form onSubmit={Name} >
        <section className="form1">
          <label>Name of product:</label>
          <input type="text" required value={productname} onChange={(e)=>setproductname(e.target.value)} />
          </section>
          <section className="form2">
          <button type="submit">Update product name</button>
          </section>
      </form>
      
      <form onSubmit={Description} >
      <section className="form1">
          <label>Description of the product:</label>
          <textarea type="text" required  rows="6" cols="-40"value={description} onChange={(e)=>setdescription(e.target.value)} ></textarea>
          </section>
          <section className="form2">
          <button type="submit">Update description</button>
          </section>
      </form>
      <form  onSubmit={Price} >
      <section className="form1">
          <label>Price:</label>
          <input type="number" min="1" max = "999" required value={price} onChange={(e)=>setprice(e.target.value)} />
          </section>
          <section className="form2">
          <button type="submit">Update price</button>
          </section>
      </form>
     
      <form onSubmit={Setnewquantity} >
      <section className="form1">
          <label>Set new quantity:</label>
          <input type="number" min = "1" max="999" required value={newquantity} onChange={(e)=>setnewquantity(e.target.value)} />
          </section>
          <section className="form2">
          <button type="submit">set quantity</button>
          </section>
      </form>
      <form onSubmit={Image}  >
      <section className="form1">
      <input type="file" id="image" accept="image/*" onChange={(e) => setimage(e.target.files[0])}/> 
      </section>
      <section className="form2">
      <button>Change image</button>
      </section>
      </form>
      </section>
      
      
  </section>
);

}



//------------------------------------------------------------


//------------------------------------------------------------







