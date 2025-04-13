import './App.css';
import {Auth} from "./components/auth";
import './App.css';

import {Route ,Routes} from "react-router-dom";
import  {Login} from "./components/login";
import {Homepage} from "./components/homepage";
import {ForgotPassword} from "./components/forgotpassword";
import { MyShop } from './components/myshop'; // or the correct relative path
import {ShopHomepage} from "./components/shophomepage";
import 'bootstrap/dist/css/bootstrap.css';
import SignUp from "./components/SignUp";

function App() {

   return (
      <section className="container">
      <Routes>
         <Route path="/signup" element={<SignUp/>} />
         <Route path ="/" element= {<Auth/>}/>
         <Route path ="/login" element= {<Login/>}/>
         <Route path ="/homepage" element= {<Homepage/>}/>
         <Route path ="/forgotpassword" element= {<ForgotPassword/>}/>
         <Route path="/myshop" element = {<MyShop/>}/>
         <Route path="/shopdashboard" element = {<ShopHomepage/>}/>


      </Routes>
   </section>
   );
}

export default App;
