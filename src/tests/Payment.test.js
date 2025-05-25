import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Payment } from '../components/payment';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PaystackButton } from 'react-paystack';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

// Mocks for external dependencies to isolate component testing
jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
}));
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
}));
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));
jest.mock('firebase/app', () => ({
  getApp: jest.fn(),
}));
jest.mock('react-paystack', () => ({
  // Mock PaystackButton as a simple button for easier click simulation
  PaystackButton: jest.fn(({ text, disabled, onSuccess, onClose }) => (
    <button data-testid="paystack-button" disabled={disabled} onClick={() => (disabled ? null : onSuccess())}>
      {text}
    </button>
  )),
}));
jest.mock('@react-google-maps/api', () => ({
  // Mock GoogleMap: calls onLoad immediately and renders a div with children
  GoogleMap: jest.fn(({ children, onClick, onLoad }) => {
    onLoad({ panTo: jest.fn(), setZoom: jest.fn() });
    return <div data-testid="google-map" onClick={onClick}>{children}</div>;
  }),
  Marker: jest.fn(() => <div data-testid="marker" />),
  Autocomplete: jest.fn(({ onLoad, onPlaceChanged, children }) => {
    // Mock autocomplete loading with dummy place data
    onLoad({ getPlace: jest.fn(() => ({ geometry: { location: { lat: () => 1, lng: () => 2 } }, formatted_address: '123 Test St' })) });
    return <div data-testid="autocomplete" onChange={onPlaceChanged}>{children}</div>;
  }),
  useJsApiLoader: jest.fn(),
}));

// Mock the browser geolocation API for consistent location testing
const mockGeolocation = {
  getCurrentPosition: jest.fn((success, error) => success({ coords: { latitude: 1, longitude: 2 } })),
};
global.navigator.geolocation = mockGeolocation;

// Mock sessionStorage to control stored data
const mockSessionStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window.location for redirect testing
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', { value: mockLocation, writable: true });

// Mock Google Maps Geocoder with predefined responses
const mockGeocoder = jest.fn().mockImplementation(() => ({
  geocode: jest.fn((params, callback) => {
    callback(
      [
        {
          address_components: [],
          types: ['street_address'],
          formatted_address: '123 Test St',
        },
      ],
      'OK'
    );
  }),
}));
global.window.google = {
  maps: {
    Geocoder: mockGeocoder,
    Size: jest.fn(() => ({})),
  },
};

describe('Payment Component', () => {
  let mockNavigate, mockUseLocation, mockAuth, mockFunctions, mockCreateOrder;

  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test for clean state

    // Setup navigation mock
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    // Setup location state with a total amount
    mockUseLocation = { state: { total: '100' } };
    useLocation.mockReturnValue(mockUseLocation);

    // Mock Firebase Auth current user
    mockAuth = { currentUser: { uid: 'user123' } };
    getAuth.mockReturnValue(mockAuth);

    // Mock Firebase Functions and the order creation callable
    mockFunctions = {};
    getFunctions.mockReturnValue(mockFunctions);
    mockCreateOrder = jest.fn().mockResolvedValue({});
    httpsCallable.mockReturnValue(mockCreateOrder);

    // Setup sessionStorage mocks for cart items, shop ID, and shop info
    mockSessionStorage.getItem
      .mockReturnValueOnce(JSON.stringify([{ id: 1, name: 'Item', price: 50, quantity: 2 }]))
      .mockReturnValueOnce('shop123')
      .mockReturnValueOnce(JSON.stringify({ nameofshop: 'Test Shop' }));

    // Pretend Google Maps API loaded successfully
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });
  });

  test('renders loading state when Google Maps is not loaded', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });
    render(<Payment />);
    // Show loader while maps API is loading
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  test('renders loading state when location is loading', () => {
    render(<Payment />);
    mockGeolocation.getCurrentPosition.mockClear();
    // Still waiting for geolocation, so loader appears
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  test('renders error state when Google Maps fails to load', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('Load error') });
    render(<Payment />);
    // Show error message on maps load failure
    expect(screen.getByText('Error loading page. Please try again later.')).toBeInTheDocument();
  });

  test('renders payment form and map when loaded', async () => {
    await act(async () => {
      render(<Payment />);
    });
    // Check main UI elements rendered: title, map, autocomplete, pay button
    expect(screen.getByText('Select Delivery Location')).toBeInTheDocument();
    expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument();
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
    expect(screen.getByTestId('autocomplete')).toBeInTheDocument();
    expect(screen.getByTestId('paystack-button')).toBeInTheDocument();
  });

  test('updates form inputs and enables Paystack button', async () => {
    await act(async () => {
      render(<Payment />);
    });
    // Fill out form inputs with valid info
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Search for your delivery address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByTestId('autocomplete'), {}); // Trigger place changed event

    await waitFor(() => {
      // After form valid, pay button should be enabled and address displayed
      expect(screen.getByText('Selected Address: 123 Test St')).toBeInTheDocument();
      expect(screen.getByTestId('paystack-button')).not.toBeDisabled();
    });
  });

  test('handles map click and validates location', async () => {
    await act(async () => {
      render(<Payment />);
    });
    // Simulate user clicking map to pick location
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });
    await waitFor(() => {
      // Address should update based on clicked location
      expect(screen.getByText('Selected Address: 123 Test St')).toBeInTheDocument();
    });
  });

  test('shows alert for invalid map click location', async () => {
    // Override geocoder to simulate invalid address
    mockGeocoder.mockImplementation(() => ({
      geocode: jest.fn((params, callback) => {
        callback(
          [
            {
              address_components: [{ types: ['natural_feature'] }],
              types: [],
              formatted_address: 'Ocean',
            },
          ],
          'OK'
        );
      }),
    }));
    jest.spyOn(window, 'alert').mockImplementation(() => {}); // Suppress alert popup

    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });

    await waitFor(() => {
      // Alert warns user to pick valid delivery address
      expect(window.alert).toHaveBeenCalledWith('Please select a valid address for delivery');
    });
  });

  test('handles geolocation error', async () => {
    // Simulate geolocation failure
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => error(new Error('Geolocation error')));
    jest.spyOn(console, 'error').mockImplementation(() => {}); // Silence console error

    await act(async () => {
      render(<Payment />);
    });
    // Should log error and still render map for manual location pick
    expect(console.error).toHaveBeenCalledWith('Error getting location: ', expect.any(Error));
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  test('handles Paystack button success and order creation', async () => {
    await act(async () => {
      render(<Payment />);
    });
    // Fill form with valid inputs
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Search for your delivery address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByTestId('autocomplete'), {});

    await waitFor(() => {
      // Paystack button should now be enabled
      expect(screen.getByTestId('paystack-button')).not.toBeDisabled();
    });

    jest.spyOn(window, 'alert').mockImplementation(() => {}); // Suppress alert
    fireEvent.click(screen.getByTestId('paystack-button')); // Simulate payment success

    await waitFor(() => {
      // Verify order created with correct data
      expect(mockCreateOrder).toHaveBeenCalledWith({
        userid: 'user123',
        address: '123 Test St',
        status: 'Ordered',
        nameofshop: 'Test Shop',
        cart_items: [{ id: 1, name: 'Item', price: 50, quantity: 2 }],
        phone: '1234567890',
        total: '100',
        customerName: 'John Doe',
        email: 'john@example.com',
      });
      // Cart should be cleared from sessionStorage
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('cartItems');
      // User redirected to /orders page
      expect(mockNavigate).toHaveBeenCalledWith('/orders');
      // Alert confirms order success
      expect(window.alert).toHaveBeenCalledWith('Order placed successfully!');
    });
  });
});
