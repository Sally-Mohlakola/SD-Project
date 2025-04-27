import './App.css';
import {Auth} from "./components/auth";
import {Route ,Routes} from "react-router-dom";
import {Homepage} from "./components/homepage";
import {MyOrders} from "./components/myorders";
import { MyShop } from './components/myshop'; // or the correct relative path
import {ShopHomepage} from "./components/shophomepage";
import {AdminShopHomepage} from './components/admin';
import {Addproduct} from "./components/addproducts";
import {Createshop} from "./components/createshop"
import 'bootstrap/dist/css/bootstrap.css';
import { DeleteProduct } from './components/removeproducts';
import {Displayproducts} from './components/displayproducts'
import { Updateproduct } from './components/updateproducts';

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
         <Route path="/addproducts" element={<Addproduct />} />
         <Route path ="/createshop" element={<Createshop/>}/>
          <Route path="/displayproducts" element={<Displayproducts />} />  
        <Route path="/removeproducts" element={<DeleteProduct />} />
        <Route path="/updateproducts" element={<Updateproduct />} />  
         
   
      </Routes>
   </section>
   );
}

export default App;
