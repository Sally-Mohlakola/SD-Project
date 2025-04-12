
import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import{useState} from "react";
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

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
            await signInWithPopup(auth, provider); // User signs into Google Account
            navigate('/homepage'); //Then go to homepage.js
            }
            catch(error){
                console.log(error);
            }
    };

    
    /*
    Also remove later, part of manual signup
    const login = () => {
        navigate('/login'); 
    };*/


    // Return the JSX elements (UI)
    return (<section>
        <h1>SignUp</h1>
    
        {/*Call the signInGoogle function from above*/}
        <button onClick ={signInGoogle}>Sign In With Google</button> 


        </section>);
        

}// 

