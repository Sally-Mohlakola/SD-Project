import React, { useState, useEffect } from "react";
import { PaystackButton } from "react-paystack";
import { useLocation, useNavigate } from "react-router-dom";


const Payment = () => {

  let navigate = useNavigate();

  function navigateCheckout(){
    navigate("/checkout");
  }

   //cart_items has stored this cart's info
   const cart = sessionStorage.getItem("cart_items");

  const location = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(""); // in ZAR
  const [phoneNumber, setPhoneNumber] = useState("");
  const publicKey = "pk_test_d444ad0b1ed380cbe61ce1d4d0b8804a3b6abb17";
//using the cart total here
  useEffect(() => {
    try{
    if (location.state && location.state.total) {
      setAmount(location.state.total); 
    }
  }catch(error){
    
  }
  
  }, [location.state]);



  const componentProps = {
//Set up the Paystack order
    
    email,
    amount: Number(amount) * 100, 
    metadata: { name, phoneNumber },
    publicKey,
    text: "Make payment",
    currency: "ZAR",  // Add this line to specify ZAR for PayStack to work
    onSuccess: () => {alert("Thank you! Your payment was successful.");
      window.location.href = '/homepage';
    },
    onClose: () => alert("You have exited the payment process. No charges were made."),
  
  };
  

  return (
    <section className="payment-container">
      <h2>Select delivery location</h2>
      
      <h2>Complete Your Purchase</h2>
      <p>Securely enter your payment details below to finalise your order.</p>
      <p>Order Total: <strong>R{amount}</strong></p>
      <section className="payment-form">
        <input type="text" value={name} placeholder="Full name" onChange={(e) => setName(e.target.value)} />
        <input type="email" value={email} placeholder="Email address" onChange={(e) => setEmail(e.target.value)} />
        <input type="tel" value={phoneNumber} placeholder="Phone number" onChange={(e) => setPhoneNumber(e.target.value)} />
      </section>
      <PaystackButton className="pay-btn" {...componentProps}
        disabled={!email || !amount || !name || !phoneNumber} />
      <button onClick={navigateCheckout}>Back</button>
    </section>
  );
};

export default Payment;
