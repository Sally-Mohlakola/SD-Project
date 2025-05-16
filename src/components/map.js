
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [searchPrompt, setSearchPrompt] = useState('');
  const forautocompletions = useRef(null);
  const mapReference = useRef(null);

  // Google Maps configuration
const containerStyle = {
width: '800px',
height: '300px'
};

  const { initialisedMap } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY, // put keys in env folder soon
    libraries: ['places']
  });

  // Get user's current location when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
    (position) => {
        setCurrentLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
        });
        setLoadingLocation(false);
        },
        (error) => {
        console.error("Error getting location: ", error);
        setCurrentLocation({ lat: 1234, lng: 1234 });
        setLoadingLocation(false);
        }
      );
    } else {
      setCurrentLocation({ lat: 1234, lng: 1234 });
      setLoadingLocation(false);
    }
  }, []);

  const autocompleteOptions = (autocomplete) => {
    forautocompletions.current = autocomplete;
  };

  const pivotChangesofMap = () => {
    if (forautocompletions.current) {
      const typedinlocation = forautocompletions.current.getPlace();
      if (typedinlocation.geometry) {
        const coordinates = {
          lat: typedinlocation.geometry.location.lat(),
          lng: typedinlocation.geometry.location.lng()
        };
        setSelectedLocation(coordinates);
        setAddress(typedinlocation.formatted_address);

        // Center the map on the selected location
        if (mapReference.current) {
          mapReference.current.panTo(coordinates);
          mapReference.current.setZoom(15);
        }
      }
    }
  };

  const handleMapClick = (event) => {
    const newLocation = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng()
    };
    setSelectedLocation(newLocation);
    getAddress(newLocation.lat, newLocation.lng);
  };

  const getAddress = async (lat, lng) => {
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: {lat, lng} }, (results, status) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
          setSearchPrompt(results[0].formatted_address);
        } else {
          setAddress('Address not found');
          setSearchPrompt('');
        }
      });
    } catch (error) {
      console.error("Geocoding error: ", error);
      setAddress('Error getting address');
    }
  };


  const mapOptions = {
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
        stylers: [{ visibility: 'on' }]
      }
    ]
  };

  if (!initialisedMap || loadingLocation) {
    return <div className="loading">Loading Map...</div>;
  }

  return (
    <section className="map">

      <section className="search-section">
        <Autocomplete
          onLoad={autocompleteOptions}
          onPlaceChanged={pivotChangesofMap}>
          <input
            type="text"
            placeholder="Search for an address"
            value={searchPrompt}
            onChange={(e) => setSearchPrompt(e.target.value)}
            className="search-input"
          />
        </Autocomplete>
      </section>

      <section className="location-selection">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={currentLocation}
          zoom={15}
          onClick={handleMapClick}
          options={mapOptions}
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
          <section className="location-info">
            <p><strong>Address:</strong> {address}</p>
          </section>
        ) : (
          <section className="location-info">
            <p>Search for delivery address or by sliding peg</p>
          </section>
        )}
      </section>
    </section>
  );