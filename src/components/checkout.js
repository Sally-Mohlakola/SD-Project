import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/checkout.css';
import React from 'react';  

export const Checkout = () => {
  const navigate = useNavigate();
  const [mycart, setmycart] = useState([]);

  useEffect(() => {
    
    //cart_items has stored this cart's info and products (the session storage of this user's current tab) 
    const cart = sessionStorage.getItem("cart_items");
    // we will covert the cart to json bc it was previously a string field
    let parsedCart = [];
    try {
      //if there is no cart just replace it with an empty array 
      parsedCart = cart ? JSON.parse(cart) : [];

    } catch (error) {
      // If items are unsuccessfuly added to cart, throw an error
      console.error("Error parsing cart_items:", error);
      parsedCart = [];
    }
    setmycart(parsedCart);
  }, []);
 
  const backtoshops = () => {
    navigate('/homepage');
  };

  // triggered whne userremoves items from cart until there is nothing left 
   const removeFromCart = (index) => {
    const updatedCart = [...mycart];
    updatedCart.splice(index, 1);
    setmycart(updatedCart);

    //stores updated cart with removed items
    sessionStorage.setItem("cart_items", JSON.stringify(updatedCart));
    if (updatedCart.length === 0) {
      sessionStorage.removeItem("chosenshop");
    }
  };

  // The arithmetic of adding and multiplying to get the correct number of items and price per product
  const totalcost = mycart.reduce((sum, myitem) => sum + Number(myitem.price) * Number(myitem.quantity), 0);
  const numofitems = mycart.reduce((num, myitem) => num + Number(myitem.quantity), 0);


  // If there are items in the cart, allow the user to head to checkout, if not the user cannot pay for an empty cart
  const handleCheckout = () => {
    if (mycart.length > 0) {
      navigate('/payment', {
        state: { total: totalcost }
      });
    } else {
      alert("Your cart is empty. Add items to your cart before proceeding to payment.");
    }
  };

  return (
    <section className="checkout-wrapper">
      <section className='checkout-section'>
       <h1>Checkout</h1>
      {mycart.length > 0 ? (
        mycart.map((item, index) => (
          <section className='product' key={index}>
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Description:</strong> {item.itemdescription}</p>
            <p><strong>Price:</strong> {item.price * item.quantity}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <button className="remove-button" onClick={() => removeFromCart(index)}>Remove from cart</button>
          </section>
        ))
      ) : (
        <p id="cartempty">Your cart is empty!</p>
      )}

      {mycart.length > 0 && (
        <section className='cartSum-section'>
          <section className='summary'><h2>Total Cost: R{totalcost}</h2></section>
          <section className='summary'><h2>Total number of items: {numofitems}</h2></section>
    
        </section>
      )}
       {mycart.length > 0 && (
        <button  className='proceed-button' onClick={handleCheckout} >Proceed to Checkout</button>
      )}
      <button className='back-button' onClick={backtoshops}> ← Home</button>
     
    </section>
    </section>
  );
};
