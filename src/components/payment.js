import React, { useState, useEffect, useRef } from "react";
import { PaystackButton } from "react-paystack";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import "../styles/payment.css";

export const Payment = () => {
  const cart = sessionStorage.getItem("cart_items");
  const shopid = sessionStorage.getItem("chosenshopid");
  const parsedCart = JSON.parse(cart || "[]");
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const publicKey = process.env.REACT_APP_PAYMENT_API_KEY;

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchPrompt, setSearchPrompt] = useState('');
  const forautocompletions = useRef(null);
  const mapReference = useRef(null);

  const containerStyle = {
    width: '100%',
    height: '300px'
  };

  const { isLoaded: isGoogleMapsLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLoadingLocation(false);
      },
        (err) => {
          console.error("Error getting location: ", err);
          setLoadingLocation(false);
        });
    }
  }, []);

  const autocomplete = (autocomplete) => {
    forautocompletions.current = autocomplete;
  };

  const capturePivotChangesOfMap = () => {
    if (forautocompletions.current) {
      const searchTabLocation = forautocompletions.current.getPlace();
      if (searchTabLocation.geometry) {
        const coordinates = {
          lat: searchTabLocation.geometry.location.lat(),
          lng: searchTabLocation.geometry.location.lng()
        };
        setSelectedLocation(coordinates);
        setAddress(searchTabLocation.formatted_address);

        if (mapReference.current) {
          mapReference.current.panTo(coordinates);
          mapReference.current.setZoom(15);
        }
      }
    }
  };

  const checkValidLocations = async (loc) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const isWater = results[0].address_components.some(element =>
            element.types.includes('natural_feature') || element.types.includes('water') ||
            element.types.includes('ocean')
          );
          const isValidLocation = results[0].types.some(type =>
            ['street_address', 'route', 'premise'].includes(type)
          );
          resolve(!isWater && isValidLocation);
        } else {
          resolve(false);
        }
      });
    });
  };

  const handleMapClick = async (event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    try {
      const isValid = await checkValidLocations(newLocation);
      if (isValid) {
        setSelectedLocation(newLocation);
        getAddress(newLocation.lat, newLocation.lng);
        if (mapReference.current) {
          mapReference.current.panTo(newLocation);
        }
      } else {
        alert("Please select a valid address for delivery");
      }
    } catch (error) {
      console.error("ERROR validating delivery address:", error);
      alert("Error validating delivery address. Please try again.");
    }
  };

  const getAddress = async (lat, lng) => {
    try {
      const geoLocator = new window.google.maps.Geocoder();
      geoLocator.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
          setSearchPrompt(results[0].formatted_address);
        } else {
          setAddress('Address not found. Try again later.');
          setSearchPrompt('');
        }
      });
    } catch (err) {
      console.error("ERROR getting delivery address: ", err);
      setAddress('Error getting address');
    }
  };

  const mapProperties = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'on' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] }
    ]
  };

  useEffect(() => {
    try {
      if (location.state && location.state.total) {
        setAmount(location.state.total);
      }
    } catch (error) {
      console.error("Error setting amount: ", error);
    }
  }, [location.state]);

  const chosenShopRaw = sessionStorage.getItem("chosenshop");
  const chosenShop = JSON.parse(chosenShopRaw || "{}");


  const componentProps = {
    email,
    amount: Number(amount) * 100,
    metadata: { name, phoneNumber },
    publicKey,
    text: "Make payment",
    currency: "ZAR",
    onSuccess: async () => {
      try {
        const functions = getFunctions(getApp());
        const createOrder = httpsCallable(functions, "createOrder");

        const sanitizedCart = parsedCart.map((item) => ({
        id:item.id,
        name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity),
}));

        await createOrder({
          userid: user?.uid,
          address: address,
          status: "Ordered",
          nameofshop: chosenShop?.nameofshop,
          cart_items: sanitizedCart,
          shopid:shopid
        });

        alert("Thank you! Your payment was successful and your order has been placed.");
        sessionStorage.removeItem("cart_items");
         console.log("hi", parsedCart);
        window.location.href = '/homepage';
      } catch (error) {

         console.log("LOG", {
      address: address,
      nameofshop: chosenShop.nameofshop,
      userid:  user?.uid,
      cart_items: parsedCart.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
    });
        alert("Order creation error:", 1);
        alert("Payment was successful, but order creation failed. Please contact support.");
        console.log("hi", parsedCart);
      }
    },
    onClose: () => alert("You have exited the payment process. No charges were made."),
  };

  if (loadError) return <section className="error">Error loading page. Please try again later.</section>;
  if (!isGoogleMapsLoaded || loadingLocation) return <section className='loader-wrapper'><section className='loader'> </section></section>;

  return (
    <section className="payment-wrapper">
      <section className="payment-section">
        <h2>Select Delivery Location</h2>
        <Autocomplete
          onLoad={autocomplete}
          onPlaceChanged={capturePivotChangesOfMap}
        >
         
          <input type="text" 
            placeholder="Search for your delivery address"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            className="delivery-search"
          />
       
        </Autocomplete>


        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentLocation}
          zoom={15}
          onClick={handleMapClick}
          options={mapProperties}
          onLoad={(map) => { mapReference.current = map; }}
        >
          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{
                url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(30, 30)
              }}
            />
          )}
        </GoogleMap>

        {selectedLocation ? (
          <p><strong>Selected Address:</strong> {address}</p>
        ) : (
          <p className="map-instruction">Search or click on the map to select a delivery location</p>
        )}
      </section>

      <section className="checkout-section">
        <h2>Complete Your Purchase</h2>
        <p className="checkout-description">Securely enter your payment details below to finalize your order.</p>
        <p className="checkout-total">Order Total: <strong>R{amount}</strong></p>
        <section className="inputs">
        <input
          type="text"
          value={name}
          placeholder="Full name"
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          value={email}
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="tel"
          value={phoneNumber}
          placeholder="Phone number"
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        </section>

        <section>
          <PaystackButton
            className="pay-btn"
            {...componentProps}
            disabled={!email || !amount || !name || !phoneNumber || !address}
          />
          </section>

          <button className='checkout-button' onClick={() => navigate("/checkout")}>
            Back to Checkout
          </button>
        </section>

      
    </section>
  );
};
