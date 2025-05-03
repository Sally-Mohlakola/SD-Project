import React, { useState,useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import {db} from "../config/firebase";
import {getDocs,collection} from "firebase/firestore"
import {ref, getDownloadURL} from "firebase/storage";
import { storage } from '../config/firebase';
import {uploadBytes} from "firebase/storage";


export const ShopHomepage =()=>{
    const currentUserId = localStorage.getItem("userid");
    const [shoplist,setShoplist]=useState([]);
    const shopcollectionRef=collection(db,"Shops"); 
    const [storename, setstorename] = useState("");
    const [imageupload,setimageupload]=useState(null);
    const [loading, setLoading] = useState(false); 
    
useEffect(()=>{
    const getshoplist= async()=>{
        try{
        const data=await getDocs(shopcollectionRef);
        const filterddata = data.docs.map((doc) => ({
            ...doc.data(), 
            userid: doc.data().userid,
            nameofshop: doc.data().nameofshop,
            description: doc.data().description,
            status: doc.data().status
          }));
        setShoplist(filterddata);
        }catch(err){
            console.error(err);
        }
    };
    getshoplist();
},[]);
const [shopimage,setshopimage]=useState("");
console.log(shopimage)
useEffect(() => {
  const setdisplay=async ()=>{
      const extensions = ['.jpg', '.jpeg', '.png'];
      const userShop = shoplist.find((shop) => shop.userid === currentUserId);
      if (userShop){
      setstorename(userShop.nameofshop); 
          for (const ext of extensions){
              
              try {
              const imagelistref=ref(storage,`Shop/${currentUserId}${ext}`);
              const url = await getDownloadURL(imagelistref);
              setshopimage(url);
              break;
              }catch(err){
                console.log(err)
              }
            }
      }  
    };
    setdisplay()
    }, [shoplist, currentUserId]);

 localStorage.setItem("shopname", storename);
const uploadimage= async()=>{
        try{
          if (imageupload==null){
            alert('please select a image for your shop');
            return;
          }
          const extension = imageupload.name.split('.').pop();
          const imageref=ref(storage,`Shop/${currentUserId}.${extension}`);
          await uploadBytes(imageref,imageupload);
          const url = await getDownloadURL(imageref);
          setshopimage(url);
          setLoading(false);
          }catch(err){
          console.error(err);
          };
         
        
        };

        if (loading){
          return (
            <section>loading image...</section>
          );
        };

 return(
    <section>
      <h1>Welcome : {storename}</h1>
      {shopimage ? (
        <img src={shopimage} alt=" " style={{ width: '100px', height: '100px', objectFit: 'contain' }} />
      ) : (
        <>
        <p>upload an image</p>
        <input type="file" onChange={(e)=> setimageupload(e.target.files[0]) }/>
        <button onClick={()=>{setLoading(true);uploadimage()}}>uploadimage</button>
        </>)}
      <nav>
        {/*Can resize headers*/}
       <li> <Link to="/displayproducts">My Products</Link></li>
       <li> <Link to="/myorders"> My Orders </Link> </li>
        <li><Link to="/inventory">Inventory</Link></li>
    </nav>
    <Link to="/homepage">Home</Link>
    
    </section>
  
 )
};
