import { useState } from "react";
import { signInWithPopup ,signInWithEmailAndPassword } from 'firebase/auth';
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password ,setPassword] = useState("");

    const login = async () => {
        try {
            await signInWithEmailAndPassword(auth ,email,password);
            navigate('/homepage');
        } catch(e) {
            console.log(e);
        }
    };

    const signInGoogle = async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch(error) {
            console.log(error);
        }
    };

    const register = () => {
        navigate("/");
    };
    const forgotpassword= () => {
        navigate("/forgotpassword");
    };

    return (
        <section>
            <h1>Login</h1>
            <label>Email:</label>
            <input placeholder="Email" onChange={(e)=>setEmail(e.target.value)} /> 
            <label>Password: </label>
            <input type="password" placeholder="Password" onChange={(e)=>setPassword(e.target.value)} />
            <button onClick={login}>Login</button>
            <button onClick={register}>Don't have an account? Sign up</button>
            <button onClick={signInGoogle}>LogIn With Google</button>
          
            <button onClick={forgotpassword}>Forgot password? reset</button>
        </section>
    );
};
