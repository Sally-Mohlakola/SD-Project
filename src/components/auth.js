import {signInWithPopup } from 'firebase/auth';
//import{useState} from "react";
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

import React, { useEffect, useState } from 'react'
import '../styles/SignUp.css';

import {db} from "../config/firebase";
import {getDocs,collection,updateDoc,doc} from "firebase/firestore";

//IMPORTANT: export functions you may want to use outside this file scope

//Auth is a type of function encapuslating the DOM changes for sign up
//Functions that represent this have the format "export const ...()=>{....}"
//Any other functionalitites you write must be encapsulated by this type of function

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

    const signInGoogle = async()=>{
        try{
            const result = await signInWithPopup(auth, provider)
            .then((result) => {
              const user = result.user;
              localStorage.setItem("userid", user.uid);  // Save the UserID 📝

                const userEmail = user.email;
              localStorage.setItem("userEmail",userEmail);

              //craftgrainlocalartisanmarketpl@gmail.com
              //check if user signing in is admin email and if yes go to admin dashboard
              // if (userEmail === adminEmail){
              //   navigate('/admin');
              // }
              // else {
              //   navigate('/homepage');
              // }
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

    
/*    const login = () => {
        navigate('/login'); 
    };

*/
    // Return the JSX elements (UI)

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

