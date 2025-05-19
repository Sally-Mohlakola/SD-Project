import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Payment } from './Payment';
import { PaystackButton } from 'react-paystack';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

// Mock all the imported modules
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn()
}));

jest.mock('@react-google-maps/api', () => ({
  GoogleMap: jest.fn(({ children, onLoad }) => {
    // Call onLoad with mock map if provided
    React.useEffect(() => {
      if (onLoad) {
        onLoad({
          panTo: jest.fn(),
          setZoom: jest.fn(),
        });
      }
    }, [onLoad]);
    return <div data-testid="google-map">{children}</div>;
  }),
  Marker: jest.fn(() => <div data-testid="map-marker" />),
  Autocomplete: jest.fn(({ children, onLoad }) => {
    // Call onLoad with mock autocomplete if provided
    React.useEffect(() => {
      if (onLoad) {
        onLoad({
          getPlace: jest.fn(() => ({
            geometry: {
              location: {
                lat: () => 1.234,
                lng: () => 5.678
              }
            },
            formatted_address: '123 Test Street, City'
          }))
        });
      }
    }, [onLoad]);
    return <div data-testid="autocomplete">{children}</div>;
  }),
  useJsApiLoader: jest.fn()
}));

jest.mock('react-paystack', () => ({
  PaystackButton: jest.fn(() => <button data-testid="paystack-button">Mock Paystack Button</button>)
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: {} })))
}));

jest.mock('firebase/app', () => ({
  getApp: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn()
}));

// Mock the global navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn().mockImplementation(success => success({
    coords: {
      latitude: 51.1,
      longitude: 45.3
    }
  }))
};
global.navigator.geolocation = mockGeolocation;

// Mock Google Maps API
const mockGoogleMapsAPI = {
  maps: {
    Geocoder: jest.fn(() => ({
      geocode: jest.fn((params, callback) => {
        if (params.location) {
          callback([{
            address_components: [
              { types: ['street_number'] },
              { types: ['route'] }
            ],
            formatted_address: '123 Test Street, City',
            types: ['street_address']
          }], 'OK');
        } else {
          callback([{
            address_components: [
              { types: ['street_number'] },
              { types: ['route'] }
            ],
            formatted_address: '123 Test Street, City',
            types: ['street_address']
          }], 'OK');
        }
      })
    })),
    Size: jest.fn((width, height) => ({ width, height }))
  }
};
global.window.google = mockGoogleMapsAPI;

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    })
  };
})();
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock window.location
delete window.location;
window.location = { href: '' };

// Setup environment variables
process.env.REACT_APP_PAYMENT_API_KEY = 'test-payment-key';
process.env.REACT_APP_GOOGLE_MAPS_API_KEY = 'test-maps-key';

describe('Payment Component', () => {
  let mockNavigate;
  let mockLocation;
  let mockUser;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock data
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cart_items') {
        return JSON.stringify([
          { name: 'Item 1', price: '100', quantity: '2' },
          { name: 'Item 2', price: '50', quantity: '1' }
        ]);
      }
      if (key === 'chosenshop') {
        return JSON.stringify({ nameofshop: 'Test Shop' });
      }
      return null;
    });
    
    // Mock router
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    mockLocation = { state: { total: '250' } };
    useLocation.mockReturnValue(mockLocation);
    
    // Mock auth
    mockUser = { uid: 'test-user-123' };
    getAuth.mockReturnValue({ currentUser: mockUser });
    
    // Mock JS API Loader
    useJsApiLoader.mockReturnValue({
      isLoaded: true,
      loadError: null
    });
  });

  test('renders payment component with Google Maps loaded', async () => {
    render(<Payment />);
    
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
    expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByText('Search or click on the map to select a delivery location')).toBeInTheDocument();
    expect(screen.getByText('Order Total:')).toBeInTheDocument();
    expect(screen.getByText('R250')).toBeInTheDocument();
  });

  test('shows loading state when Google Maps is loading', () => {
    useJsApiLoader.mockReturnValueOnce({
      isLoaded: false,
      loadError: null
    });
    
    render(<Payment />);
    
    expect(screen.getByText('Loading ...')).toBeInTheDocument();
  });

  test('shows error when Google Maps fails to load', () => {
    useJsApiLoader.mockReturnValueOnce({
      isLoaded: true,
      loadError: new Error('Failed to load')
    });
    
    render(<Payment />);
    
    expect(screen.getByText('Error loading page. Please try again later.')).toBeInTheDocument();
  });

  test('updates form fields correctly', () => {
    render(<Payment />);
    
    const nameInput = screen.getByPlaceholderText('Full name');
    const emailInput = screen.getByPlaceholderText('Email address');
    const phoneInput = screen.getByPlaceholderText('Phone number');
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    
    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(phoneInput.value).toBe('1234567890');
  });

  test('handles map click', async () => {
    render(<Payment />);
    
    const googleMap = screen.getByTestId('google-map');
    
    // Simulate map click
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    // Wait for address to be processed
    await waitFor(() => {
      expect(mockGoogleMapsAPI.maps.Geocoder).toHaveBeenCalled();
    });
  });

  test('handles autocomplete place changed', async () => {
    const { getByTestId } = render(<Payment />);
    
    // Find the autocomplete component
    const autocomplete = getByTestId('autocomplete');
    
    // Find the input inside autocomplete and trigger change
    const input = screen.getByPlaceholderText('Search for an address');
    fireEvent.change(input, { target: { value: '123 Test' } });
    
    // Simulate place_changed event
    const autocompleteComponent = Autocomplete.mock.calls[0][0];
    autocompleteComponent.onPlaceChanged();
    
    // Check if address is updated
    await waitFor(() => {
      expect(screen.getByText(/Selected Address:/)).toBeInTheDocument();
      expect(screen.getByText(/123 Test Street, City/)).toBeInTheDocument();
    });
  });

  test('navigates back to checkout when back button is clicked', () => {
    render(<Payment />);
    
    const backButton = screen.getByText('Back to Checkout');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  test('handles payment success and order creation', async () => {
    const mockCreateOrder = jest.fn().mockResolvedValue({ data: { success: true } });
    httpsCallable.mockReturnValue(mockCreateOrder);
    
    render(<Payment />);
    
    // Fill in all form fields
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    
    // Set up a selected address
    const googleMap = screen.getByTestId('google-map');
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Selected Address:/)).toBeInTheDocument();
    });
    
    // Get PaystackButton props
    const paystackProps = PaystackButton.mock.calls[0][0];
    
    // Manually trigger the onSuccess callback
    await paystackProps.onSuccess();
    
    // Verify order creation was called
    expect(httpsCallable).toHaveBeenCalled();
    expect(mockCreateOrder).toHaveBeenCalled();
    expect(mockCreateOrder.mock.calls[0][0]).toMatchObject({
      userid: 'test-user-123',
      nameofshop: 'Test Shop',
      status: 'Ordered'
    });
    
    // Verify session storage was cleared
    expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('cart_items');
    
    // Verify redirection
    expect(window.location.href).toBe('/homepage');
  });

  test('handles order creation error', async () => {
    const mockCreateOrder = jest.fn().mockRejectedValue(new Error('Order creation failed'));
    httpsCallable.mockReturnValue(mockCreateOrder);
    
    // Mock window.alert
    const mockAlert = jest.fn();
    global.alert = mockAlert;
    
    render(<Payment />);
    
    // Fill in all form fields
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    
    // Set up a selected address
    const googleMap = screen.getByTestId('google-map');
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Selected Address:/)).toBeInTheDocument();
    });
    
    // Get PaystackButton props
    const paystackProps = PaystackButton.mock.calls[0][0];
    
    // Manually trigger the onSuccess callback
    await paystackProps.onSuccess();
    
    // Verify error handling
    expect(mockAlert).toHaveBeenCalledWith('Order creation error:', 1);
    expect(mockAlert).toHaveBeenCalledWith('Payment was successful, but order creation failed. Please contact support.');
  });

  test('handles payment cancellation', () => {
    // Mock window.alert
    const mockAlert = jest.fn();
    global.alert = mockAlert;
    
    render(<Payment />);
    
    // Get PaystackButton props
    const paystackProps = PaystackButton.mock.calls[0][0];
    
    // Manually trigger the onClose callback
    paystackProps.onClose();
    
    // Verify alert message
    expect(mockAlert).toHaveBeenCalledWith('You have exited the payment process. No charges were made.');
  });

  test('handles case where no cart items exist', () => {
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cart_items') {
        return null;
      }
      if (key === 'chosenshop') {
        return JSON.stringify({ nameofshop: 'Test Shop' });
      }
      return null;
    });
    
    render(<Payment />);
    
    // Component should still render without error
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
  });

  test('handles case where no chosen shop exists', () => {
    sessionStorageMock.getItem.mockImplementation((key) => {
      if (key === 'cart_items') {
        return JSON.stringify([
          { name: 'Item 1', price: '100', quantity: '2' }
        ]);
      }
      if (key === 'chosenshop') {
        return null;
      }
      return null;
    });
    
    render(<Payment />);
    
    // Component should still render without error
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
  });

  test('handles case where no user is logged in', () => {
    getAuth.mockReturnValue({ currentUser: null });
    
    render(<Payment />);
    
    // Component should still render without error
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
  });

  test('handles location state with no total', () => {
    useLocation.mockReturnValue({ state: {} });
    
    render(<Payment />);
    
    // Component should still render without error
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
    expect(screen.getByText('Order Total:')).toBeInTheDocument();
    expect(screen.getByText('R')).toBeInTheDocument(); // Empty amount
  });

  test('handles invalid locations on map click', async () => {
    // Mock window.alert
    const mockAlert = jest.fn();
    global.alert = mockAlert;
    
    // Mock checkValidLocations to return false for invalid location
    const originalGeocode = mockGoogleMapsAPI.maps.Geocoder().geocode;
    mockGoogleMapsAPI.maps.Geocoder = jest.fn(() => ({
      geocode: jest.fn((params, callback) => {
        if (params.location) {
          callback([{
            address_components: [
              { types: ['natural_feature', 'water'] }
            ],
            formatted_address: 'Ocean Location',
            types: ['natural_feature']
          }], 'OK');
        } else {
          originalGeocode(params, callback);
        }
      })
    }));
    
    render(<Payment />);
    
    const googleMap = screen.getByTestId('google-map');
    
    // Simulate map click on water location
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 0,
        lng: () => 0
      }
    });
    
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Please select a valid address for delivery');
    });
  });

  test('handles geocoder error', async () => {
    // Mock console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock window.alert
    const mockAlert = jest.fn();
    global.alert = mockAlert;
    
    // Mock geocoder to return error
    mockGoogleMapsAPI.maps.Geocoder = jest.fn(() => ({
      geocode: jest.fn((params, callback) => {
        callback([], 'ERROR');
      })
    }));
    
    render(<Payment />);
    
    const googleMap = screen.getByTestId('google-map');
    
    // Simulate map click
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith('Error validating delivery address. Please try again.');
    });
    
    mockConsoleError.mockRestore();
  });

  test('handles getAddress error', async () => {
    // Mock console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock geocoder to return error for getAddress function
    const originalGeocode = mockGoogleMapsAPI.maps.Geocoder().geocode;
    let callCount = 0;
    
    mockGoogleMapsAPI.maps.Geocoder = jest.fn(() => ({
      geocode: jest.fn((params, callback) => {
        callCount++;
        // First call is for checkValidLocations (return valid)
        if (callCount === 1) {
          callback([{
            address_components: [
              { types: ['street_number'] },
              { types: ['route'] }
            ],
            formatted_address: '123 Test Street, City',
            types: ['street_address']
          }], 'OK');
        } 
        // Second call is for getAddress (return error)
        else {
          callback([], 'ERROR');
        }
      })
    }));
    
    render(<Payment />);
    
    const googleMap = screen.getByTestId('google-map');
    
    // Simulate map click
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    await waitFor(() => {
      expect(screen.getByText('Address not found. Try again later.')).toBeInTheDocument();
    });
  });

  test('handles getAddress exception', async () => {
    // Mock console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock geocoder to throw exception
    mockGoogleMapsAPI.maps.Geocoder = jest.fn(() => ({
      geocode: jest.fn(() => {
        throw new Error('Test error');
      })
    }));
    
    render(<Payment />);
    
    const googleMap = screen.getByTestId('google-map');
    
    // Simulate map click
    fireEvent.click(googleMap, {
      latLng: {
        lat: () => 12.345,
        lng: () => 67.890
      }
    });
    
    await waitFor(() => {
      expect(mockConsoleError).toHaveBeenCalled();
      expect(screen.getByText('Error getting address')).toBeInTheDocument();
    });
    
    mockConsoleError.mockRestore();
  });

  test('handles geolocation error', () => {
    // Mock geolocation to trigger error
    navigator.geolocation.getCurrentPosition.mockImplementationOnce((success, error) => 
      error({ code: 1, message: 'User denied geolocation' })
    );
    
    // Mock console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<Payment />);
    
    expect(mockConsoleError).toHaveBeenCalled();
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
    
    mockConsoleError.mockRestore();
  });
});
