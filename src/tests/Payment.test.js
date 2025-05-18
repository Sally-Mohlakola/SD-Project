import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Payment } from '../components/payment';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaystackButton } from 'react-paystack';
import { GoogleMap, Autocomplete, Marker, useJsApiLoader } from '@react-google-maps/api';

// Mock all external dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('react-paystack', () => ({
  PaystackButton: jest.fn(({ children, ...props }) => (
    <button {...props}>{children || props.text}</button>
  )),
}));

jest.mock('@react-google-maps/api', () => ({
  GoogleMap: jest.fn(({ children, onLoad, ...props }) => {
    // Call onLoad with mock map ref if provided
    if (onLoad) {
      const mockMap = {
        panTo: jest.fn(),
        setZoom: jest.fn()
      };
      onLoad(mockMap);
    }
    return <section data-testid="google-map" {...props}>{children}</section>;
  }),
  Marker: jest.fn(() => <section data-testid="map-marker" />),
  Autocomplete: jest.fn(({ children, onLoad }) => {
    // Test for the autocomplete functionality
    if (onLoad) {
      const mockAutocomplete = {
        getPlace: jest.fn(() => ({
          geometry: {
            location: {
              lat: () => -26.2041,
              lng: () => 28.0473
            }
          },
          formatted_address: '01234 Mock Street, Johannesburg, 01234'
        }))
      };
      onLoad(mockAutocomplete);
    }
    return <section data-testid="autocomplete">{children}</section>;
  }),
  useJsApiLoader: jest.fn(),
}));

// Mock console.error to prevent test output clutter
const originalConsoleError = console.error;
console.error = jest.fn();

describe('Payment Component', () => {
  const mockNavigate = jest.fn();
  const mockLocation = {
    state: {
      total: 100
    }
  };

  // Mock geolocation API
  const mockGeolocation = {
    getCurrentPosition: jest.fn()
      .mockImplementation((success) => 
        success({
          coords: {
            latitude: 0.0,
            longitude: 0.0
          }
        })
      )
  };

  // Mock the Google Maps api we used to select a location
  const mockGeocoder = {
    geocode: jest.fn()
  };

  beforeEach(() => {
    global.navigator.geolocation = mockGeolocation;
    global.alert = jest.fn();
    
    window.google = {
      maps: {
        Geocoder: jest.fn(() => mockGeocoder),
        Size: jest.fn(() => ({})),
        LatLng: jest.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
        Map: jest.fn(),
        Marker: jest.fn(),
        event: {
          addListener: jest.fn(),
          removeListener: jest.fn()
        },
        places: {
          AutocompleteService: jest.fn(),
          PlacesService: jest.fn(),
          PlacesServiceStatus: {
            OK: 'OK'
          }
        }
      }
    };

    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
    useJsApiLoader.mockReturnValue({ 
      isLoaded: true, 
      loadError: null 
    });
    
    //Mock the sessionStorage of the cart the user pays for
    sessionStorage.setItem('cart_items', JSON.stringify([{ name: 'mock test item', price: 100 }]));
    sessionStorage.setItem('chosenshop', 'Test Shop');
    
    //Mock the API keys (stored in .env so they are now environment variables)
    process.env.REACT_APP_PAYMENT_API_KEY = 'test-paystack-api-key';
    process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-google-maps-api-key';
    
    // Mock address geocoding response for successful cases
    mockGeocoder.geocode.mockImplementation((request, callback) => {
      if (request.location) {
        callback([
          {
            geometry: {
              location: {
                lat: () => request.location.lat,
                lng: () => request.location.lng
              }
            },
            formatted_address: '0123 Test Street, Johannesburg, 0123',
            address_components: [
              { types: ['street_address'], long_name: '0123 Test Street' }
            ],
            types: ['street_address']
          }
        ], 'OK');
      } else {
        callback([], 'ERROR');
      }
    });
  });

  /*clear the cache of mocks since we want each test to run mocks independantly, with no leftover
  data for the next state which might affect its accuracy*/
  afterEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('Loading states of Google Map components', () => {
    it('renders loading... message when Google Maps is loading', () => {
      useJsApiLoader.mockReturnValueOnce({ isLoaded: false, loadError: null });
      render(<Payment />);
      expect(screen.getByText(/Loading .../i)).toBeInTheDocument();
    });

    it('shows an error if Google Maps fails to load', () => {
      useJsApiLoader.mockReturnValueOnce({ isLoaded: false, loadError: new Error('Load error') });
      render(<Payment />);
      expect(screen.getByText(/Error loading page/i)).toBeInTheDocument();
    });

    it('the current client location is the initial default map location', () => {
      render(<Payment />);
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  describe('Geolocation Components verification', () => {
    // mock the geolocation pinning the current location of the client as a starting location
    it('successful geolocation', async () => {
      rehandlender(<Payment />);
      await waitFor(() => {
        expect(GoogleMap).toHaveBeenCalledWith(
          expect.objectContaining({
            center: { lat: 0.0, lng: 0.0 },
            zoom: 15
          }),
          expect.anything()
        );
      });
    });

    it('throwing a geolocation error', async () => {
      mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => 
        error({ code: 1, message: 'GeoLocation Error' })
      );
      
      render(<Payment />);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error getting location: ",
          expect.objectContaining({ code: 1, message: 'GeoLocation Error' })
        );
        expect(screen.queryByTestId('google-map')).toBeInTheDocument();
      });
    });
  });

  describe('Form Component verification', () => {
    it('user input into fields handled accurately', async () => {
      render(<Payment />);
      
      fireEvent.change(screen.getByPlaceholderText(/Full name/i), { target: { value: 'Misha Kahn' } });
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'mockemail@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Phone number/i), { target: { value: '0123456789' } });

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Full name/i).value).toBe('Misha Kahn');
        expect(screen.getByPlaceholderText(/Email address/i).value).toBe('mockemail@example.com');
        expect(screen.getByPlaceholderText(/Phone number/i).value).toBe('0123456789');
      });
    });

    it('renders correct order total', async () => {
      render(<Payment />);
      await waitFor(() => {
        expect(screen.getByText(/Order Total: R100/i)).toBeInTheDocument();
      });
    });

    it('handles missing location state', async () => {
      useLocation.mockReturnValueOnce({ state: null });
      render(<Payment />);
      await waitFor(() => {
        expect(screen.getByText(/Order Total: R/i)).toBeInTheDocument();
      });
    });

    it('handles error setting total payment amount', async () => {
      useLocation.mockReturnValueOnce({ 
        state: Object.defineProperty({}, 'total', {
          get: () => { throw new Error('Error setting total payment amount'); }
        })
      });
      
      render(<Payment />);
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Error setting total payment amount: ", expect.any(Error));
      });});
  });

  describe('Map and Address Handling', () => {
    it('fill in addresss search with Autocomplete capability', async () => {
      render(<Payment />);
      
      const autocomplete = Autocomplete.mock.calls[0][0];
      const placechange = autocomplete.onPlaceChanged;
   
      placechange();
      
      await waitFor(() => {
        expect(screen.getByText(/Selected Address: 123 Test Street, Johannesburg/i)).toBeInTheDocument();
      });
    });

    it('should handle map click with valid location', async () => {
      // Mock checkValidLocations and return true for valid locations (that are not the ocean, landscape, etc)
      mockGeocoder.geocode.mockImplementationOnce((request, callback) => {
        callback([
          {
            geometry: {location: {lat: () => 0.0, lng: () => 0.0}},
            formatted_address: '0123 Mock Street, Johannesburg, 0123',
            address_components: [
              { types: ['street_address'], long_name: '0123 Mock Street' }
            ],
            types: ['street_address']
          }
        ], 'OK');
      });

      render(<Payment />);
      
      const googleMapCalls = GoogleMap.mock.calls[0][0];
      const onClick = googleMapCalls.onClick;
      
      const mockEvent = {
        latLng: {lat: () => 0.0, lng: () => 0.0}};
      
      await onClick(mockEvent);
      
      await waitFor(() => {
        expect(screen.getByText(/Selected Address: 0123 Mock Street, Johannesburg, 0123/i)).toBeInTheDocument();
      });
    });

    it('should handle map click with invalid delivery location (body of water)', async () => {
      // Mock checkValidLocations to returns false for if the location is water
      mockGeocoder.geocode.mockImplementationOnce((request, callback) => {
        callback([
          {
            address_components: [
              { types: ['natural_feature', 'water'], long_name: 'Mock Ocean' }
            ],
            types: ['natural_feature']
          }
        ], 'OK');
      });

      render(<Payment />);

      const googleMapProps = GoogleMap.mock.calls[0][0];
      const onClickHandler = googleMapProps.onClick;
   
      const mockEvent = {
        latLng: {
          lat: () => 0,
          lng: () => 0
        }
      };
      
      await onClickHandler(mockEvent);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Please select a valid address for delivery');
      });
    });

    it(' map click error during validation', async () => {
      // checkValidLocations throwing an error
      mockGeocoder.geocode.mockImplementationOnce(() => {
        throw new Error('Geocoder error');
      });

      render(<Payment/>);
      
      const googleMapProps = GoogleMap.mock.calls[0][0];
      const onClick = googleMapProps.onClick;

      const mockEvent = {
        latLng: {lat: () => 0, lng: () => 0}};
    
      await onClick(mockEvent);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('ERROR validating delivery address:', expect.any(Error));
        expect(global.alert).toHaveBeenCalledWith('Error validating delivery address. Please try again.');
      });
    });

    it('should handle address geocoding error', async () => {
      // Mock getAddress to return an error
      mockGeocoder.geocode.mockImplementationOnce((request, callback) => {
        callback([], 'ERROR');
      });

      render(<Payment />);
      
      // Directly call getAddress with test coordinates
      const addressInput = screen.getByPlaceholderText('Search for an address');
      fireEvent.change(addressInput, { target: { value: 'Test Address' } });
      
      // Get the onClick handler from GoogleMap props to trigger getAddress
      const googleMapsCalls = GoogleMap.mock.calls[0][0];
      const onClick = googleMapsCalls.onClick;
      
      // Create a mock event with latLng
      const mockLocation = {
        latLng: {
          lat: () => 0.0,
          lng: () => 0.0
        }
      };
      
      // Call the onClick handler with the mock event
      await onClick(mockLocation);
      
      // Mock error in getAddress by implementing geocode to return error
      mockGeocoder.geocode.mockImplementationOnce((request, callback) => {
        callback([], 'ERROR');
      });
      
      // Call again with the error scenario
      await onClick(mockLocation);
      
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining('ERROR getting delivery address:'), expect.any(Error));
      });
    });
    
    it('renders search tab input change', async () => {
      render(<Payment />);
      
      const searchInput = screen.getByPlaceholderText('Search for an address');
      fireEvent.change(searchInput, { target: { value: 'Test Address' } });
      
      await waitFor(() => {
        expect(searchInput.value).toBe('Test Address');
      });
    });
  });

  describe('Payment Component verification', () => {
    it('disables Paystack button if form is incomplete', async () => {
      render(<Payment />);
      await waitFor(() => {
        expect(screen.getByText(/Make payment/i).disabled).toBe(true);
      });
    });

    it('enables Paystack button when the form is complete', async () => {
      render(<Payment />);
      
      //The form fields are filled in and a valid delivery address is selected
      fireEvent.change(screen.getByPlaceholderText(/Full name/i), { target: { value: 'Mock User' } });
      fireEvent.change(screen.getByPlaceholderText(/Email address/i), { target: { value: 'mockemail@example.com' } });
      fireEvent.change(screen.getByPlaceholderText(/Phone number/i), { target: { value: '0123456789' } });
 
      const googleMapsCalls = GoogleMap.mock.calls[0][0];
      const onClick = googleMapsCalls.onClick;

      const mockLocation = {
        latLng: {
          lat: () => 0.0,
          lng: () => 0.0
        }
      };
      

      await onClick(mockLocation);
      
      await waitFor(() => {
        // After form completion and address selection, enable the Paystack button
        expect(screen.getByText(/Make payment/i).disabled).toBe(false);
      });
    });

    it('payment success', async () => {
      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: jest.fn() };
      
      render(<Payment />);
 
      const mockPaystackButton = PaystackButton.mock.calls[0][0];
      
      // Call the onSuccess handler (mock successful payment)
      mockPaystackButton.onSuccess();
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Thank you! Your payment was successful.');
        expect(window.location.href).toBe('/homepage');
        expect(sessionStorage.getItem('cart_items')).toBeNull();
      });
      
      // Restore window.location
      window.location = originalLocation;
    });

    it('should handle payment close', async () => {
      render(<Payment />);
      
      // Get Paystack props
      const mockPaystackButton = PaystackButton.mock.calls[0][0];
      
      // Call onClose handler (no payment attempted)
      mockPaystackButton.onClose();
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('You have exited the payment process. No charges were made.');
      });
    });
  });

  describe('Navigation checks', () => {
    it('navigation to checkout', async () => {
      render(<Payment />);
      fireEvent.click(screen.getByText(/Back to Checkout/i));
      expect(mockNavigate).toHaveBeenCalledWith('/checkout');
    });
  });
});
