import {signInWithPopup } from 'firebase/auth';
//import{useState} from "react";
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

import React from 'react'
import '../styles/SignUp.css';

//IMPORTANT: export functions you may want to use outside this file scope

//Auth is a type of function encapuslating the DOM changes for sign up
//Functions that represent this have the format "export const ...()=>{....}"
//Any other functionalitites you write must be encapsulated by this type of function

export const Auth=()=>{
    const navigate = useNavigate();
    /*
    Remove
    const[email, setEmail] = useState("");
    const[password, setPassword] = useState(""); 

    const register =async() =>{
        try{
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/homepage');
    }
        catch(error){
            console.log(error);
        }
    };

      <label>Email:</label><input placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/> 
        <label>Password: </label><input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)}/>
        <button onClick={register}>Register</button>
             
        <button onClick={login}>Have an account? Login</button>
*/
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
              if (userEmail == "craftgrainlocalartisanmarketpl@gmail.com"){
                navigate('/admin');
              }
              else {
                navigate('/homepage');
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
      
    // return (<section>
    //     <h1>SignUp</h1>
    
    //     {/*Call the signInGoogle function from above*/}
    //     <button onClick ={signInGoogle}>Sign In With Google</button> 

    //     </section>);
        

}//export

