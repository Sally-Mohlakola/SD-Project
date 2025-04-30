import{useEffect,useState } from 'react';
import { useNavigate } from "react-router-dom";


export const Checkout=()=>{
const navigate = useNavigate();
const [mycart,setmycart] =useState([]);

 useEffect(() => {
    const cart=sessionStorage.getItem("cart_items");
    let parsedCart = [];
    try {
      parsedCart = cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error parsing cart_items:", error);
      parsedCart = []; 
    }
    setmycart(parsedCart);
  }, []);

console.log(mycart);;
const backtoshops=()=>{
navigate('/homepage');

};
const removeFromCart = (index) => {
    const updatedCart = [...mycart];
    updatedCart.splice(index, 1);
    setmycart(updatedCart);
    sessionStorage.setItem("cart_items", JSON.stringify(updatedCart));
    if (updatedCart==''){
      sessionStorage.removeItem("chosenshop");
    }
  };
//CACLULATE THE TOTAL AMOUNT of items and cost for the whole order 

const totalcost = mycart.reduce((sum, myitem) => sum + myitem.price * myitem.quantity,0);
const numofitems=mycart.reduce((quantity, myitem) => quantity + myitem.quantity,0);

return(


<section>
      {mycart.length > 0 ? (
        mycart.map((item,index) => (
          <section key={index}>
            <p>Name: {item.name}</p>
            <p>Description: {item.itemdescription}</p>
            <p>Price: {item.price *item.quantity}</p>
            <p>Quantity: {item.quantity}</p>
            <button onClick={()=>{removeFromCart(index)}}>Remove from cart</button>
            <section> 
              <h2> Total Cost: {totalcost} </h2>
              <h2>Total number of items : {numofitems}</h2>
            </section>
          </section>
         
        ))
      ) : (
        <p>Your cart is empty!</p>
      )}
      <button onClick={backtoshops}>Back</button>
    </section>
  );

};