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

  // User states prepared for Payment Gateway fields
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const publicKey = process.env.REACT_APP_PAYMENT_API_KEY;

  // User states prepared for Google Maps API fields
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

  /*Load the Google Maps JavaScript API using our API key and include the 'places'
  library for location search/autocomplete*/
  const { isLoaded: isGoogleMapsLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  // As map first mounts, it gets the user's current location as starting point
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
  // Search bar autocomplete for valid delivery locatios
  const autocomplete = (autocomplete) => {
    forautocompletions.current = autocomplete;
  };
  
  const capturePivotChangesOfMap = () => {
    if (forautocompletions.current) {
      const searchTabLocation = forautocompletions.current.getPlace(); // Get the place selected in autocomplete
      if (searchTabLocation.geometry) { // If the place has geometry (lat/lng), then save these coordinates in user state
        const coordinates = {
          lat: searchTabLocation.geometry.location.lat(),
          lng: searchTabLocation.geometry.location.lng()
        };
        setSelectedLocation(coordinates); // Save the well-defined, formatted location data
        setAddress(searchTabLocation.formatted_address); 

        if (mapReference.current) {
          mapReference.current.panTo(coordinates); // Move the map center to new location for user ease
          mapReference.current.setZoom(15);  // Zoom in to level 15 for closer view
        }
      }
    }
  };

  // Check if delivery location is accessible
  const checkValidLocations = async (loc) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const isWater = results[0].address_components.some(element =>
            element.types.includes('natural_feature') || element.types.includes('water') ||
            element.types.includes('ocean') // No delivery to inaccessible, or unhabited locations (mountains, open terrain, bodies of water)
          );
          const isValidLocation = results[0].types.some(type =>
            ['street_address', 'route', 'premise'].includes(type) // Only allow user to selected a location which is one of these categories
          );
          resolve(!isWater && isValidLocation); // Boolean check to accept the location if it passes validation checks
        } else {
          resolve(false); // If false, location is not resolved
        }
      });
    });
  };

  // From user mouse clicks, check if a location is valid before saving its data
  const handleMapClick = async (event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    try {
      // Check if selected location is valid
      const isValid = await checkValidLocations(newLocation);
      if (isValid) {
        // Save textual and geometric (latitude and longitude) data from location
        setSelectedLocation(newLocation);
        getAddress(newLocation.lat, newLocation.lng);
        if (mapReference.current) { // Use this location as new reference point
          mapReference.current.panTo(newLocation); // Pan to this location
        }
      } else {
        alert("Please select a valid address for delivery");
      }
    } catch (error) {
      console.error("ERROR validating delivery address:", error);
      alert("Error validating delivery address. Please try again.");
    }
  };

  // Convert textual location data into geolocation (lat, lng)
  const getAddress = async (lat, lng) => {
    try {
      // Reverse geoencoding to convert readable address to latitude and longitude using geoCode()
      const geoLocator = new window.google.maps.Geocoder();
      geoLocator.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results[0]) {
           // If successful, set address and update search prompt with the formatted address
          setAddress(results[0].formatted_address);
          setSearchPrompt(results[0].formatted_address);
        } else { // Message presented to the user below in the JSX
          setAddress('Address not found. Try again later.');
          setSearchPrompt('');
        }
      });
    } catch (err) { // Log error
      console.error("ERROR getting delivery address: ", err);
      setAddress('Error getting address');
    }
  };

  // Customise Googlemap characterisitcs like poi (map visible landmarks like stores, businesses ) for ease of reference
  const mapProperties = {
    disableDefaultUI: true, // Removes all default map controls (zoom, map type, etc.)
    zoomControl: true,  
    mapTypeControl: false,  // Disables the button to switch between map/satellite view
    streetViewControl: false, // Disable street view
    fullscreenControl: false, //Disable full screen
    styles: [
      { featureType: 'poi', stylers: [{ visibility: 'on' }] },
      { featureType: 'transit', stylers: [{ visibility: 'off' }] } //Remove transport lines
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

// Data send to the Payment gateway
  const componentProps = {
    email,
    amount: Number(amount) * 100,
    metadata: { name, phoneNumber },
    publicKey,
    text: "Make payment",
    currency: "ZAR",
    onSuccess: async () => {
      try {
        // If payment is successful the order is created and will be stored
        const functions = getFunctions(getApp());
        const createOrder = httpsCallable(functions, "createOrder");
        //Prepare cart data to send as argument Cloud Function call
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
        // Alert buyer of successful purchase
        alert("Thank you! Your payment was successful and your order has been placed.");
        // Clear the UI cart as items have been purchased
        sessionStorage.removeItem("cart_items");
         console.log("Parsed cart: ", parsedCart);
        window.location.href = '/homepage'; // Send user back to homepage
      } catch (error) {
        // Log delivery, shop and cart data for error handling
         console.log("LOG DETAILS: ", {
      address: address,
      nameofshop: chosenShop.nameofshop,
      userid:  user?.uid,
      cart_items: parsedCart.map((item) => ({
          name: item.name,
          price: Number(item.price),
          quantity: Number(item.quantity)
        })),
    });
      
        alert("Payment was successful, but order creation failed. Please contact support.");
        console.log("Parsed cart: ", parsedCart);
      }
    }, // User cancels payment.
    onClose: () => alert("You have exited the payment process. No charges were made."),
  };

  if (loadError) return <section className="error">Error loading page. Please try again later.</section>;
  if (!isGoogleMapsLoaded || loadingLocation) return <section className='loader-wrapper'><section className='loader'> </section></section>;

  return (
    <section className="payment-wrapper">
      <section className="payment-section">
        <h2>Select Delivery Location</h2>
          {/* Present the search tab and Google map as two options for delivery location selectiom */}
        <Autocomplete
          onLoad={autocomplete}
          onPlaceChanged={capturePivotChangesOfMap}
        >
    
          <input type="text" placeholder="Search for your delivery address"
          value={searchPrompt} onChange={(e) => setSearchPrompt(e.target.value)}
            className="delivery-search"  style={{ width: '100%' }}
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
          {/* Red peg for map delivery location selection. Responsive to mouse click. Verify if the location is valid */}
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
        {/* Disable payment button if fields are missing */}
        <section>
          <PaystackButton
            className="pay-btn"
            {...componentProps}
            disabled={!email || !amount || !name || !phoneNumber || !address}
          />
          </section>

          <button className='checkout-button' onClick={() => navigate("/checkout")}>
            ← Checkout
          </button>
        </section>

      
    </section>
  );
};
