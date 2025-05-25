import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/createShop.css';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const Createshop = () => {
  const navigate = useNavigate(); //used to navigate between pages
  //defined the usestates that we need 
  const currentUserId = localStorage.getItem("userid"); //fetch userID from local storage
  //variables for input form and validation
  const [shoplist, setShoplist] = useState([]); //fetch shop lists
  const [newshopname, setnewshopname] = useState("");
  const [newshopdescription, setnewshopdescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [category, setcategory] = useState("");
  const [nameexists, setnameexists] = useState(false);
  //variables fro image 
  const [imageupload, setimageupload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false); 
  const fileInputRef = useRef(null);
  
//thus useffect get the shops from the database and adds them to a usestate so that we can use later
  useEffect(() => {
    const getshoplist = async() => {
      try {
        const functions = getFunctions();
        const getAllShops = httpsCallable(functions, 'getAllShops');
        const result = await getAllShops({});
        setShoplist(result.data.shops);
      } catch(err) {
        console.error(err);
      }
    };
    getshoplist();
  }, []);
  
// this function take the image of the shops logo and converts it to base64 so that it can be sent to the firebase function 
  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  //trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
//this function is triggered when the person inputs an image for the shop log and it is added in to the usesate for later use 
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setimageupload(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
//this function send the shop details to the admin
  const sendtoadmin = async() => {
    try {
      //if the usestates are empty the details will not be sent
      //validation of fields before submission
      if (!imageupload || !newshopname || !newshopdescription || !category) {
        alert('Please complete all fields before submitting');
        return;
      }
      
      setLoading(true);
      //takes the image we stored in the usestate and converts it to base 64 using the function we created earlier
      const base64Image = await toBase64(imageupload);
      //get the extention of the image 
      const extension = imageupload.name.split('.').pop();
      //calls the createshop firebase function 
      const functions = getFunctions();
      const createShop = httpsCallable(functions, 'createShop'); 
      //sends the data to the backend so the shop can be created
      const result = await createShop({
        userid: currentUserId,
        nameofshop: newshopname,
        description: newshopdescription,
        status: "Awaiting",
        category: category,
        image: base64Image.split(',')[1],
        ext: extension
      });
      setSubmitted(!!result);
    } catch(err) {
      console.error(err);
      alert("Error submitting shop. Please try again.");
    } finally {
      setLoading(false);
    }
  };
//this function uses the shops we have gotten previously and then checks if the name the person has added is already in the shop this is to prevent 2 shops with the same name
  const checkshopname = (shops) => {
    const userShop = shoplist.find((shop) => shop.nameofshop === shops);
    setnameexists(!!userShop);
  };
//navigates to the homepage when triggered
  const backhome = () => {
    navigate('/homepage');
  };

  //UI frontend
  return (
    <section className="create-shop">
      <h1>Creating my Shop</h1>
    {/*   if the usestate loading is set to true it will show thi loading state */}
      {loading ? (
        <section className="shop-alert">Submitting your shop...</section>
      ) : submitted ? (
        
        <section>    {/* this will be shown after the sunmission of the shop*/}

          <section className="shop-alert">Your shop has been sent to admin</section>
          <button className="back-btn-up" onClick={backhome}>Home</button>
        </section>
      ) : (
        <form>
          <section className="form-field">{/*this input take in the user store and checks if the shop name exists already */}
            <label htmlFor="shop-name">Name of shop</label>
            <input
              id="shop-name"
              type="text"
              onChange={(e) => {
                setnewshopname(e.target.value);
                checkshopname(e.target.value);
              }}
            />
          </section>

          <section className="form-field">
            <label htmlFor="shop-category">Category:</label>
            <select
              id="shop-category"
              defaultValue=""
              onChange={(e) => setcategory(e.target.value)}
            >
              <option value="" disabled>Select a Category</option>{/* a drop down of the diffrent categories the person can chose */}
              <option>Pottery</option>
              <option>Paint</option>
              <option>Leatherwork</option>
              <option>Woodworking</option>
              <option>Weaving</option>
              <option>Metalwork</option>
              <option>Jewelry</option>
              <option>Knitting</option>
            </select>
          </section>

          <section className="form-field">
            <label htmlFor="shop-desc">Shop description</label>
            <textarea
              id="shop-desc"
              onChange={(e) => setnewshopdescription(e.target.value)}
            />
          </section>

          <section className="form-field file-upload-container">
            <label className="file-upload-label">{/* this is where the person can upload their logo fro thier shop */}
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="image-preview"
                  />
                  <section className="image-actions">
                    <button 
                      type="button" 
                      className="change-image-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        triggerFileInput();
                      }}
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        setimageupload(null);
                        setImagePreview(null);
                      }}
                    >
                      Remove
                    </button>
                  </section>
                </>
              ) : (
                <>
                  <section className="file-upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="#7F5539">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </section>
                  <section className="file-upload-text">Upload Shop Image</section>
                  <section className="file-upload-hint">PNG, JPG up to 5MB</section>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="file-input"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </>
              )}
            </label>
          </section>

          <section className="button-container">{/* this is the button that will send data to the admin when triggered */}
            <button
              type="button" className="submittoadmin"
              onClick={() => {
                if (nameexists) {
                  alert("A store with that name exists");
                } else {
                  sendtoadmin();
                }
              }}
            >
              Submit to admin
            </button>
            <button type="button"  className="submittoadmin" onClick={backhome}>Cancel</button>
          </section>
        </form>
      )}
    </section>
  );
};
