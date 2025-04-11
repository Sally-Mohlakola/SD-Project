import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import{useState} from "react";
import { auth, provider } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

export const Auth=()=>{

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

        <button onClick ={signInGoogle}>Sign In With Google</button>

        {/*<button onClick={logout}>Logout</button>*/}

        </section>);
}

