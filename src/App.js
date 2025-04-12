import './App.css';
import {Auth} from "./components/auth";
import './App.css';
import React, { useState ,useEffect} from 'react';

import {Route ,Routes} from "react-router-dom";
import  {Login} from "./components/login";
import {Homepage} from "./components/homepage";
import {ForgotPassword} from "./components/forgotpassword";
import { MyShop } from './components/myshop'; // or the correct relative path

import { useNavigate } from 'react-router-dom';
import { auth } from './config/firebase'; 
function App() {
 
   return (
      <section className="container">
      <Routes>
         <Route path ="/" element= {<Auth/>}/>
         <Route path ="/login" element= {<Login/>}/>
         <Route path ="/homepage" element= {<Homepage/>}/>
         <Route path ="/forgotpassword" element= {<ForgotPassword/>}/>
         <Route path="/myshop" element = {<MyShop/>}/>

      </Routes>
   </section>
   );
  
}

export default App;
