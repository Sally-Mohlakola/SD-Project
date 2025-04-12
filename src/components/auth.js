
import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import{useState} from "react";
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

export const Auth=()=>{
    const navigate = useNavigate();
    /*const[email, setEmail] = useState("");
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
            await signInWithPopup(auth, provider);
            navigate('/homepage');
            }
            catch(error){
                console.log(error);
            }
    };

    
    const login = () => {
        navigate('/login'); 
    };
    // set state to value of input
    return (<section>
        <h1>SignUp</h1>
      

        <button onClick ={signInGoogle}>Sign In With Google</button>


        </section>);
}

