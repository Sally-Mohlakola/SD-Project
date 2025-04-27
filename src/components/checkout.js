import { useNavigate } from "react-router-dom";


export const Checkout=()=>{
const navigate = useNavigate();

const backtoshops=()=>{
navigate('/homepage');

};
return(

<sections>Here are ure items
<button onClick={backtoshops}>Back</button>

</sections>
    
)

};