import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { Payment } from '../components/payment';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { PaystackButton } from 'react-paystack';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

// Mock dependencies
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
  PaystackButton: jest.fn(({ text, disabled, onSuccess, onClose }) => (
    <button data-testid="paystack-button" disabled={disabled} onClick={() => (disabled ? null : onSuccess())}>
      {text}
    </button>
  )),
}));
jest.mock('@react-google-maps/api', () => ({
  GoogleMap: jest.fn(({ children, onClick, onLoad }) => {
    onLoad({ panTo: jest.fn(), setZoom: jest.fn() });
    return <div data-testid="google-map" onClick={onClick}>{children}</div>;
  }),
  Marker: jest.fn(() => <div data-testid="marker" />),
  Autocomplete: jest.fn(({ onLoad, onPlaceChanged, children }) => {
    onLoad({ getPlace: jest.fn(() => ({ geometry: { location: { lat: () => 1, lng: () => 2 } }, formatted_address: '123 Test St' })) });
    return <div data-testid="autocomplete" onChange={onPlaceChanged}>{children}</div>;
  }),
  useJsApiLoader: jest.fn(),
}));

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn((success, error) => success({ coords: { latitude: 1, longitude: 2 } })),
};
global.navigator.geolocation = mockGeolocation;

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', { value: mockSessionStorage });

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', { value: mockLocation, writable: true });

// Mock Google Maps Geocoder
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
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    mockUseLocation = { state: { total: '100' } };
    useLocation.mockReturnValue(mockUseLocation);
    mockAuth = { currentUser: { uid: 'user123' } };
    getAuth.mockReturnValue(mockAuth);
    mockFunctions = {};
    getFunctions.mockReturnValue(mockFunctions);
    mockCreateOrder = jest.fn().mockResolvedValue({});
    httpsCallable.mockReturnValue(mockCreateOrder);
    mockSessionStorage.getItem
      .mockReturnValueOnce(JSON.stringify([{ id: 1, name: 'Item', price: 50, quantity: 2 }]))
      .mockReturnValueOnce('shop123')
      .mockReturnValueOnce(JSON.stringify({ nameofshop: 'Test Shop' }));
    useJsApiLoader.mockReturnValue({ isLoaded: true, loadError: null });
  });

  test('renders loading state when Google Maps is not loaded', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: null });
    render(<Payment />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  test('renders loading state when location is loading', () => {
    render(<Payment />);
    mockGeolocation.getCurrentPosition.mockClear();
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  test('renders error state when Google Maps fails to load', () => {
    useJsApiLoader.mockReturnValue({ isLoaded: false, loadError: new Error('Load error') });
    render(<Payment />);
    expect(screen.getByText('Error loading page. Please try again later.')).toBeInTheDocument();
  });

  test('renders payment form and map when loaded', async () => {
    await act(async () => {
      render(<Payment />);
    });
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
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Search for your delivery address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByTestId('autocomplete'), {});
    await waitFor(() => {
      expect(screen.getByText('Selected Address: 123 Test St')).toBeInTheDocument();
      expect(screen.getByTestId('paystack-button')).not.toBeDisabled();
    });
  });

  test('handles map click and validates location', async () => {
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });
    await waitFor(() => {
      expect(screen.getByText('Selected Address: 123 Test St')).toBeInTheDocument();
    });
  });

  test('shows alert for invalid map click location', async () => {
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
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please select a valid address for delivery');
    });
  });

  test('handles geolocation error', async () => {
    mockGeolocation.getCurrentPosition.mockImplementationOnce((success, error) => error(new Error('Geolocation error')));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      render(<Payment />);
    });
    expect(console.error).toHaveBeenCalledWith('Error getting location: ', expect.any(Error));
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  test('handles Paystack button success and order creation', async () => {
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Search for your delivery address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByTestId('autocomplete'), {});
    await waitFor(() => {
      expect(screen.getByTestId('paystack-button')).not.toBeDisabled();
    });
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    fireEvent.click(screen.getByTestId('paystack-button'));
    await waitFor(() => {
      expect(mockCreateOrder).toHaveBeenCalledWith({
        userid: 'user123',
        address: '123 Test St',
        status: 'Ordered',
        nameofshop: 'Test Shop',
        cart_items: [{ id: 1, name: 'Item', price: 50, quantity: 2 }],
        shopid: 'shop123',
      });
      expect(window.alert).toHaveBeenCalledWith('Thank you! Your payment was successful and your order has been placed.');
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('cart_items');
      expect(window.location.href).toBe('/homepage');
    });
  });

  test('handles Paystack button success with order creation failure', async () => {
    mockCreateOrder.mockRejectedValueOnce(new Error('Order creation failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.change(screen.getByPlaceholderText('Full name'), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByPlaceholderText('Email address'), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Phone number'), { target: { value: '1234567890' } });
    fireEvent.change(screen.getByPlaceholderText('Search for your delivery address'), { target: { value: '123 Test St' } });
    fireEvent.change(screen.getByTestId('autocomplete'), {});
    await waitFor(() => {
      expect(screen.getByTestId('paystack-button')).not.toBeDisabled();
    });
    fireEvent.click(screen.getByTestId('paystack-button'));
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Payment was successful, but order creation failed. Please contact support.');
    });
  });

  test('handles Paystack button close', async () => {
    PaystackButton.mockImplementationOnce(({ onClose }) => (
      <button data-testid="paystack-button" onClick={onClose}>
        Close
      </button>
    ));
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('paystack-button'));
    expect(window.alert).toHaveBeenCalledWith('You have exited the payment process. No charges were made.');
  });

  test('navigates back to checkout', async () => {
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByText('← Checkout'));
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  test('handles missing location.state.total', async () => {
    useLocation.mockReturnValue({ state: {} });
    await act(async () => {
      render(<Payment />);
    });
    expect(screen.getByText('Order Total: R')).toBeInTheDocument();
  });

  test('handles invalid sessionStorage data', async () => {
    mockSessionStorage.getItem
      .mockReturnValueOnce('invalid JSON')
      .mockReturnValueOnce('shop123')
      .mockReturnValueOnce('invalid JSON');
    await act(async () => {
      render(<Payment />);
    });
    expect(screen.getByTestId('google-map')).toBeInTheDocument();
  });

  test('handles geocoder failure', async () => {
    mockGeocoder.mockImplementation(() => ({
      geocode: jest.fn((params, callback) => callback([], 'ERROR')),
    }));
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });
    await waitFor(() => {
      expect(screen.getByText('Selected Address: Address not found. Try again later.')).toBeInTheDocument();
    });
  });

  test('handles geocoder error', async () => {
    mockGeocoder.mockImplementation(() => {
      throw new Error('Geocoder error');
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await act(async () => {
      render(<Payment />);
    });
    fireEvent.click(screen.getByTestId('google-map'), {
      latLng: { lat: () => 1, lng: () => 2 },
    });
    await waitFor(() => {
      expect(screen.getByText('Selected Address: Error getting address')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalledWith('ERROR getting delivery address: ', expect.any(Error));
    });
  });
});