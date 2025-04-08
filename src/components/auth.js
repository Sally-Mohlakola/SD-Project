
import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import{useState} from "react";
import { auth, provider } from '../config/firebase';

export const Auth=()=>{

    const[email, setEmail] = useState("");
    const[password, setPassword] = useState(""); 

    const register =async() =>{
        try{
        await createUserWithEmailAndPassword(auth, email, password);
        }
        catch(error){
            console.log(error);
        }
    };

    const signInGoogle = async()=>{
        try{
            await signInWithPopup(auth, provider);
            }
            catch(error){
                console.log(error);
            }
    };

    const logout = async()=>{
        try{
            await signOut(auth);
            }
            catch(error){
                console.log(error);
            }
    };

    // set state to value of input
    return (<section>
        <label>Email:</label><input placeholder="Email" onChange={(e)=>setEmail(e.target.value)}/> 
        <label>Password: </label><input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)}/>
        <button onClick={register}>Register</button>

        <button onClick ={signInGoogle}>Sign In With Google</button>

        <button onClick={logout}>Logout</button>
        </section>);
}

