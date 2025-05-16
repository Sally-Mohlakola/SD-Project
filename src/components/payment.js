import React, {useState, useEffect, useRef} from "react";
import {PaystackButton} from "react-paystack";
import'../styles/payment.css'
import {useLocation, useNavigate} from "react-router-dom";
import {GoogleMap, Marker, Autocomplete, useJsApiLoader} from '@react-google-maps/api';

export const Payment = () => {

  const cart = sessionStorage.getItem("cart_items");
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const publicKey = "pk_test_d444ad0b1ed380cbe61ce1d4d0b8804a3b6abb17"; // put in env file later

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchPrompt, setSearchPrompt] = useState('');
  const forautocompletions = useRef(null);
  const mapReference = useRef(null);

  let navigate = useNavigate();

  function navigateCheckout() {
    navigate("/checkout");
  }

  // Google Maps configuration, move to CSS
  const containerStyle = {
    width: '100%',
    height: '65vh'
  };

  const {isLoaded: isGoogleMapsLoaded, loadError} = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: 'AIzaSyBQoVBhURy0Sg2SeM8AYMjAcMd0Rb-Stqo', // put in env file later
    libraries: ['places']
  });

  // Get user's current location when component mounts
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

  // Check if the location is not arbitrary, like a body of water or natural landscape
  const checkValidLocations = async (loc) => {
    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise((resolve) => {
      geocoder.geocode({ location: loc }, (results, status) => {
        if (status === 'OK' && results[0]) {

          // Check address if elements are bodies of water or the natural world
          const isWater = results[0].address_components.some(element => 
            element.types.includes('natural_feature')|| element.types.includes('water') ||
            element.types.includes('ocean')
          );
          
          // Check if this is a valid address to deliver at (address structure)
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
    // First verify if the location is valid before allowing ordering 
    const isValid = await checkValidLocations(newLocation);
    
    if (isValid) {
      setSelectedLocation(newLocation);
      getAddress(newLocation.lat, newLocation.lng);
      
      if (mapReference.current) {
        mapReference.current.panTo(newLocation);
      }
    } else {
      alert("Please select a valid address for delivery"); // might remove later
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
      {
        featureType: 'poi',
        stylers: [{ visibility: 'on' }]
      },
      {
        featureType: 'transit',
        stylers: [{ visibility: 'off' }]
      }
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


  /*---------------------------------PAYMENT DETAILS START HERE-------------------------------------*/
  const componentProps = {
    email,
    amount: Number(amount) * 100,
    metadata: { name, phoneNumber },
    publicKey,
    text: "Make payment",
    currency: "ZAR",
    onSuccess: () => {
      alert("Thank you! Your payment was successful.");
      window.location.href = '/homepage';
      sessionStorage.removeItem("cart_items");
    },
    onClose: () => alert("You have exited the payment process. No charges were made."),
  };
/*------------------------------------------------------------------------------------------*/

  if (loadError) {
    return <section className="error">Error loading page. Please try again later.</section>;
  } // set to style later

  if (!isGoogleMapsLoaded || loadingLocation) {
    return <section className="loading">Loading ...</section>; // set to style later
  }

  return (
    <section className="Outer">
      <section className="section_map">
        <h2>Select Delivery Location</h2>
        <Autocomplete
          onLoad={autocomplete}
          onPlaceChanged={capturePivotChangesOfMap}
        >
          <input
            type="text"
            placeholder="Search for an address"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            className="search-input"
          />
        </Autocomplete>

        <GoogleMap
        mapContainerClassName="google-map"
          mapContainerStyle={containerStyle}
          center={currentLocation}
          zoom={15}
          onClick={handleMapClick}
          options={mapProperties}
          onLoad={(map) => { mapReference.current = map; }}>

          {selectedLocation && (
            <Marker
              position={selectedLocation}
              icon={{url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png', scaledSize: new window.google.maps.Size(30, 30)
              }}/>
          )}
        </GoogleMap>
        
        
        {selectedLocation ? (
          <p><strong>Selected Address:</strong> {address}</p>
        ) : (
          <p>Search or click on the map to select a delivery location</p>
        )}
      </section>

      <section className="section_payment">
        <h2>Complete Your Purchase</h2>
        <p>Securely enter your payment details below to finalize your order.</p>
        <p className="order-total">Order Total: <strong>R{amount}</strong></p>

        {/*input form below*/}
        <>
          <input type="text" value={name} placeholder="Full name"
            onChange={(e) => setName(e.target.value)} required />

          <input type="email" value={email} placeholder="Email address"
            onChange={(e) => setEmail(e.target.value)} required />

          <input type="phone-number" value={phoneNumber} placeholder="Phone number"
            onChange={(e) => setPhoneNumber(e.target.value)} required />
        </>
        {/*input form */}

         <section className="buttons">
        <PaystackButton className="pay-btn" {...componentProps}
          disabled={!email || !amount || !name || !phoneNumber || !selectedLocation} />
        <button className="back-btn" onClick={navigateCheckout}>Back to Checkout</button>
        </section>
      </section>
    </section>
  );
};

