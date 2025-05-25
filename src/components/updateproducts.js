import { useNavigate } from "react-router-dom";
import { useState } from "react";
import '../styles/updateproducts.css'
import { httpsCallable } from "firebase/functions";
import { functions } from "../config/firebase";



export const Updateproduct=()=>{
    
    let navigate=useNavigate();
    const Back=()=>{
      navigate('/displayproducts');
  };

    let shopid=localStorage.getItem('shopid');
    const Item=localStorage.getItem('Item');
    const productid=localStorage.getItem('productupdateid');
    console.log("productid:",productid);
    console.log("Have the item stored as "+Item)
    console.log("Item stored in localStorage:", localStorage.getItem("Item"));
    //--------------------------------------------------------------------------
    const[productname,setproductname]=useState("");
    const[description,setdescription]=useState("");
    const[price,setprice]=useState("");
    
    const[newquantity,setnewquantity]=useState("");
    const[image, setimage]=useState(null);
    //------------------------------------------------------------

    const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
  ///////////////////////////////////////////////////////
  const Image= async(e)=>{
    e.preventDefault();
  const base64 = await toBase64(image); // imageFile is from input
  const extension = image.name.split('.').pop();
  const updateImage = httpsCallable(functions, "updateProductImage");
  try {
    const res = await updateImage({
      shopid:shopid,
      productId:productid,
      base64Image: base64,
      ext:extension
    });
    alert(res.data.message); // "Image updated successfully!"
    navigate("/displayproducts");
  } catch (err) {
    console.error("Error:", err);
    alert("Failed to upload image.");

  }
};







     //------------------------------------------------------------

const Name=async(e)=>{
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
//------------------------------------------------------------
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
//------------------------------------------------------------
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
//------------------------------------------------------------

//------------------------------------------------------------
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
//------------------------------------------------------------


return(
  <section className="updateprod-section">
    <section className="updateprod-heading"><h1>Update product</h1></section>
      
      <section className="inputs">
      <form onSubmit={Name}>
          <label>Name of product:</label>
          <input type="text" required value={productname} onChange={(e)=>setproductname(e.target.value)} />
          <button type="submit">Update product name</button>
      </form>
      
      <form onSubmit={Description} >
          <label>Description of the product:</label>
          <textarea type="text" required  rows="6" cols="-40"value={description} onChange={(e)=>setdescription(e.target.value)} ></textarea>
          <button type="submit">Update description</button>
      </form>

      <form onSubmit={Price} >
          <label>Price:</label>
          <input type="number" min="1" max = "999" required value={price} onChange={(e)=>setprice(e.target.value)} />
          <button type="submit">Update price</button>
      </form>
     
      <form onSubmit={Setnewquantity} >
          <label>Quantity:</label>
          <input type="number" min = "1" max="999" required value={newquantity} onChange={(e)=>setnewquantity(e.target.value)} />
          <button type="submit">Update quantity</button>
      </form>

      <form onSubmit={Image}  >
      <input type="file" id="image" accept="image/*" onChange={(e) => setimage(e.target.files[0])}/> 
      <button>Update image</button>
      </form>

      </section>
      <button className='back-btn-up' onClick={Back}>← Back</button>
      
  </section>
);
}
