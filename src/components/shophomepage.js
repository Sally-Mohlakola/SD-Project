import React, { useState,useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/searchTab.css'; // from styles folder, import searchTab.css
import '../styles/shopdashboard.css';
import { getFunctions, httpsCallable } from "firebase/functions";




export const ShopHomepage =()=>{
    const currentUserId = localStorage.getItem("userid");
    const [shoplist,setShoplist]=useState([]);
    const [storename, setstorename] = useState("");
  

   // const [imageupload,setimageupload]=useState(null);
    const [loading, setLoading] = useState(true); 
    const [ imageExists, setImageExits]= useState(false);
useEffect(()=>{
    const getshoplist= async()=>{
try{
        const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        setShoplist(result.data.shops);
        setLoading(false);
        }catch(err){
            console.error(err);
        }
    };
    getshoplist();
},[]);

const [shopimage,setshopimage]=useState("");


useEffect(() => {
  const setDisplay = async () => {
    const userShop = shoplist.find((shop) => shop.userid === currentUserId);
    if (userShop) {
      setstorename(userShop.nameofshop);
      let exist = false;

      try {
        const functions = getFunctions();
        const findShopImage = httpsCallable(functions, 'findShopImage');
        const result = await findShopImage({ url: userShop.imageurl });
        setshopimage(result.data.imageUrl);
        exist = true;
      } catch (err) {
        console.error(err);
      }

      setImageExits(exist);
    }
  };

  setDisplay();
}, [shoplist, currentUserId]);
  
console.log("shopimage",shopimage);

 localStorage.setItem("shopname", storename);
/*const uploadimage= async()=>{
        try{
          if (imageupload==null){
            alert('please select a image for your shop');
            return;
          } setLoading(true); 
        
          const extension = imageupload.name.split('.').pop();
          const imageref=ref(storage,`Shop/${currentUserId}.${extension}`);
          await uploadBytes(imageref,imageupload);
          const url = await getDownloadURL(imageref);
          setshopimage(url);
          setLoading(false);
          }catch(err){
          console.error(err);
          }
          
         
        
        };*/

        if (loading){
          return (
            <section className='loading-message'>Loading shop...</section>
          );
        };

 return(
    <section className='storeDash-section'>
      <h1 className='storeDash-heading'>Welcome  {storename}</h1>
      <section className='shop-logo'>
        {!imageExists? (
        <p className='loading-message'>Loading...</p>
      ):(
        <img src={shopimage} alt=" " className='shop-logo'/>
      ) }
      </section>
      <section className='storeDash-links'>
        <nav>
        {/*Can resize headers*/}
        <ul>
          <li> <Link to="/displayproducts">My Products</Link></li>
       <li> <Link to="/myorders"> My Orders </Link> </li>
        <li><Link to="/myinventory">Inventory</Link></li>
        </ul>
    </nav>
    <Link to="/homepage">Home</Link>
      </section>
    
    </section>
  
 )
};
