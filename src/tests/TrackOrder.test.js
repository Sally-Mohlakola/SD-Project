import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TrackOrders } from '../components/trackorders';
import * as firebaseFunctions from 'firebase/functions';
import { MemoryRouter } from 'react-router-dom';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; },
    removeItem: (key) => { delete store[key]; }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock useNavigate
const mockedNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

// Properly mock firebase/functions module here:
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

describe('TrackOrders Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockedNavigate.mockReset();

    // Reset mocks on firebase functions before each test
    firebaseFunctions.getFunctions.mockReset();
    firebaseFunctions.httpsCallable.mockReset();
  });

  it('shows loading initially and then displays orders for current user', async () => {
    localStorage.setItem('userid', 'user123');

    const ordersData = {
      orders: [
        {
          userid: 'user123',
          products: [
            { name: 'Product A', quantity: 2, price: 100 },
            { name: 'Product B', quantity: 1, price: 50 },
          ],
          address: '123 Street',
          status: 'Shipped'
        },
        {
          userid: 'user999', // different user, should be filtered out
          products: [{ name: 'Other Product', quantity: 1, price: 10 }],
          address: 'Other Address',
          status: 'Pending'
        }
      ]
    };

    // Mock calling getOrders
    firebaseFunctions.getFunctions.mockReturnValue({});
    firebaseFunctions.httpsCallable.mockReturnValue(() => Promise.resolve({ data: ordersData }));

    render(
      <MemoryRouter>
        <TrackOrders />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    // Expected user submitted data
    expect(screen.getByText(/Order #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Product A/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity: 2/i)).toBeInTheDocument();
    expect(screen.getByText(/Price: R100/i)).toBeInTheDocument();
    expect(screen.getByText(/Product B/i)).toBeInTheDocument();
    expect(screen.getByText(/Address: 123 Street/i)).toBeInTheDocument();
    expect(screen.getByText(/Status: Shipped/i)).toBeInTheDocument();

    expect(screen.queryByText(/Other Product/i)).not.toBeInTheDocument();
  });

  it('shows message if no orders for current user', async () => {
    localStorage.setItem('userid', 'user123');

    const ordersData = {
      orders: [
        { userid: 'user999', products: [], address: '', status: 'Pending' }
      ]
    };

    firebaseFunctions.getFunctions.mockReturnValue({});
    firebaseFunctions.httpsCallable.mockReturnValue(() => Promise.resolve({ data: ordersData }));

    render(
      <MemoryRouter>
        <TrackOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/You don't have any orders to track/i)).toBeInTheDocument();
  });

  it('handles error fetching orders and stops loading', async () => {
    localStorage.setItem('userid', 'user123');

    firebaseFunctions.getFunctions.mockReturnValue({});
    firebaseFunctions.httpsCallable.mockReturnValue(() => Promise.reject(new Error('Failed to fetch')));

    jest.spyOn(console, 'error').mockImplementation(() => {}); // suppress error logs

    render(
      <MemoryRouter>
        <TrackOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/You don't have any orders to track/i)).toBeInTheDocument();

    console.error.mockRestore();
  });

  it('navigates to homepage when button clicked', async () => {
    localStorage.setItem('userid', 'user123');

    firebaseFunctions.getFunctions.mockReturnValue({});
    firebaseFunctions.httpsCallable.mockReturnValue(() => Promise.resolve({ data: { orders: [] } }));

    render(
      <MemoryRouter>
        <TrackOrders />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading.../i)).not.toBeInTheDocument();
    });

    const button = screen.getByText(/← Homepage/i);
    fireEvent.click(button);
    expect(mockedNavigate).toHaveBeenCalledWith('/homepage');
  });
});
