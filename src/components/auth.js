import {signInWithPopup } from 'firebase/auth';

import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

import React, { useEffect, useState } from 'react'
import '../styles/SignUp.css';

import {db} from "../config/firebase";
import {getDocs,collection,updateDoc,doc} from "firebase/firestore";


export const Auth=()=>{
    const navigate = useNavigate();
    
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

    //Sign in with google pop-up
    const signInGoogle = async()=>{
        try{
            const result = await signInWithPopup(auth, provider)
            .then((result) => {
              const user = result.user;
              localStorage.setItem("userid", user.uid); 

                const userEmail = user.email;
              localStorage.setItem("userEmail",userEmail);

            
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
        <section className="signup-section">
          <article className="signup-article">
            <h1>Crafts & Grain</h1>
      
            {/* Call the signInGoogle function when clicking the styled button */}
            <button type="button" className="google-button" onClick={signInGoogle}>
              <i className="fa-brands fa-google"></i> Sign in with Google
            </button>
          </article>
        </section>
      );       

}//export

