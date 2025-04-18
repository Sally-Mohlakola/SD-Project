import './App.css';
import {Auth} from "./components/auth";
import {Route ,Routes} from "react-router-dom";
import {Homepage} from "./components/homepage";
import {MyOrders} from "./components/myorders";
import { MyShop } from './components/myshop'; // or the correct relative path
import {ShopHomepage} from "./components/shophomepage";
import {AdminShopHomepage} from './components/admin';
import 'bootstrap/dist/css/bootstrap.css';

function App() {

   return (
      <section className="container">
      <Routes>
         <Route path ="/" element= {<Auth/>}/>
         <Route path ="/homepage" element= {<Homepage/>}/>
         <Route path="/myshop" element = {<MyShop/>}/>
         <Route path="/shopdashboard" element = {<ShopHomepage/>}/>
         <Route path="/myorders" element = {<MyOrders/>}/>
         <Route path="/admin" element={<AdminShopHomepage />} />

         
   
      </Routes>
   </section>
   );
}

export default App;
