import { createUserWithEmailAndPassword, signOut, signInWithPopup } from 'firebase/auth';
import { auth, provider } from '../config/firebase';
import { useNavigate } from "react-router-dom";

export const Homepage=()=>{
    const navigate = useNavigate();
    const logout = async()=>{
        try{
            await signOut(auth);
            navigate('/');
            }
            catch(error){
                console.log(error);
            }
    };
return (
<section>
    <h1>HomePage</h1>

    <button onClick={logout}>Logout</button>
</section>


)
};