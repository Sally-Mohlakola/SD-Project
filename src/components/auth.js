import {signInWithPopup } from 'firebase/auth';

import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

import React, { useEffect, useState } from 'react'
import '../styles/SignUp.css';
import {db} from "../config/firebase";
import {getDocs,collection,updateDoc,doc} from "firebase/firestore";


export const Auth=()=>{
    const navigate = useNavigate();
    const [progress, setProgress] = useState(0);
    const [adminEmail, setAdminEmail] = useState([]);

    //fetch admin email from firebase
    useEffect(() => {
      const fetchAdmin = async () => {
        try {
          const adminRef = collection(db, 'Admin'); 
          const data = await getDocs(adminRef);

          const adminData = data.docs.map((doc) => doc.data().AdminEmail);
        setAdminEmail(adminData);
        } catch (error) {
          console.error(error);
        }
      };
      fetchAdmin();
    }, []);

    const goToSignIn = () => {
    setProgress(1);
  };

    //Sign in with google pop-up
    const signInGoogle = async()=>{
        try{
            const result = await signInWithPopup(auth, provider)
            .then((result) => {
              const user = result.user;
              localStorage.setItem("userid", user.uid); 

                const userEmail = user.email;
              localStorage.setItem("userEmail",userEmail);

            window.scrollTo(0,0);
              if (adminEmail.includes(user.email)) {
                navigate('/admin');  // Navigate to the admin dashboard
              } else {
                navigate('/homepage');  // Navigate to the homepage
              }
            })

            }
            catch(error){
                console.log(error);
            }
    };



  return (
    <section className="whole_">
      <section
        className="landing"
        style={{
          opacity: 1 - progress,
          transform: `translateY(${-progress * 50}px)`,
          pointerEvents: progress === 1 ? 'none' : 'auto',
        }}
      >
        <h1 className="tracking-in-contract-bck-top">Crafts&Grain</h1>

        <p className='fade-in-up'>local excellency.</p>
        <button className='first-button fade-in-up' onClick={goToSignIn} style={{ animationDelay: "1.2s" }}>Next</button>
      </section>

      <section
        className="sign-in"
        style={{
          opacity: progress,
          transform: `translateY(${(1 - progress) * 50}px)`,
          pointerEvents: progress === 0 ? 'none' : 'auto',
        }}
      >
        <h2>Crafts&Grain</h2>
        <p className='desc-section' style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>Explore a curated collection of unique, handcrafted goods and fresh local flavors.</p>
        <p className='desc-section' style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>Connect with passionate creators to bring the heart of craftsmanship and community right to your doorstep. </p>
   
        <button className="google-button" onClick={signInGoogle}>
          <i className="fa-brands fa-google"></i> Sign in with Google
        </button>
</section>
</section>
  );

}//export
