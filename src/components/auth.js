import {signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from 'react'
import '../styles/SignUp.css';
import { getFunctions, httpsCallable } from 'firebase/functions';


export const Auth=()=>{
    const navigate = useNavigate(); //used to navigate between pages
    const [progress, setProgress] = useState(0); //used to manage page transition
    //usestate to store the admins email to compare later
    const [adminEmail, setAdminEmail] = useState([]);

    //fetch admin email from firebase
    useEffect(() => {
      const fetchAdmin = async () => {
        try {
        const functions = getFunctions();
        //call the getadmin firebase function to get the email
        const getAdminEmail = httpsCallable(functions, 'getAdminEmail');
        const result = await getAdminEmail({});
        const adminData = result.data.email; //extract email from result
        console.log(adminData);
        setAdminEmail(adminData);
        } catch (error) {
          console.error(error);
        }
      };
      fetchAdmin();
    }, []);

    //trigger UI transition from landing sceen to login screen
    const goToSignIn = () => {
    setProgress(1);
  };

    //Sign in with google pop-up
    const signInGoogle = async()=>{
        try{ 
            //show google login popup
            const result = await signInWithPopup(auth, provider)
            .then((result) => {
              const user = result.user;
                //store userid and email locally
              localStorage.setItem("userid", user.uid); 

                const userEmail = user.email;
              localStorage.setItem("userEmail",userEmail);

            window.scrollTo(0,0); //scroll to top of page after login
                
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


//UI frontend
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
