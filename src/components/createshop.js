import React, { useState, useEffect, useRef } from 'react';
import { db } from "../config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { storage } from '../config/firebase';
import { ref as storageRef, uploadBytes } from "firebase/storage";
import '../styles/createShop.css';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const Createshop = () => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("userid");
  const [shoplist, setShoplist] = useState([]);
  const [newshopname, setnewshopname] = useState("");
  const [newshopdescription, setnewshopdescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [category, setcategory] = useState("");
  const [nameexists, setnameexists] = useState(false);
  const [imageupload, setimageupload] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setimageupload(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const sendtoadmin = async() => {
    try {
      if (!imageupload || !newshopname || !newshopdescription || !category) {
        alert('Please complete all fields before submitting');
        return;
      }
      setLoading(true);
      const base64Image = await toBase64(imageupload);
      const extension = imageupload.name.split('.').pop();
      const functions = getFunctions();
      const createShop = httpsCallable(functions, 'createShop'); 
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

  const checkshopname = (shops) => {
    const userShop = shoplist.find((shop) => shop.nameofshop === shops);
    setnameexists(!!userShop);
  };

  const backhome = () => {
    navigate('/homepage');
  };

  return (
    <section className="create-shop">
      <h1>Creating my Shop</h1>

      {loading ? (
        <section className="shop-alert">Submitting your shop...</section>
      ) : submitted ? (
        <section>
          <section className="shop-alert">Your shop has been sent to admin</section>
          <button className="back-btn-up" onClick={backhome}>Home</button>
        </section>
      ) : (
        <form>
          <section className="form-field">
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
              <option value="" disabled>Select a Category</option>
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
            <label className="file-upload-label">
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

          <section className="button-container">
            <button
              type="button"
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
            <button type="button" className="back-btn-up" onClick={backhome}>Cancel</button>
          </section>
        </form>
      )}
    </section>
  );
};