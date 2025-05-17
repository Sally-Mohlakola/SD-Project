import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Checkout } from '../components/checkout';
import * as ReactRouterDom from 'react-router-dom';


jest.mock('react-router-dom', () => {
  const react = jest.requireActual('react-router-dom');
  return {...react, useNavigate: jest.fn(),};});

const mockNavigate = jest.fn();

const renderWithRouter = (component, { route = '/checkout' } = {}) => {
  window.history.pushState({}, 'test', route);
  return render(component, { wrapper: MemoryRouter });
};

beforeEach(() => {
  ReactRouterDom.useNavigate.mockReturnValue(mockNavigate);
  window.sessionStorage.clear();
  mockNavigate.mockClear();
  jest.clearAllMocks();
});

describe('Checkout Component', () => {
  test('handles cart items with missing fields', async () => {
    const malformedItems = [{ name: 'item1' }, { price: 10, quantity: 2 } ];
    window.sessionStorage.setItem('cart_items', JSON.stringify(malformedItems));

    renderWithRouter(<Checkout />);

    await waitFor(() => {
    // If there cart has missing fields, then the total cost should be zero (cannot pay for malformed items)
      expect(screen.getByText(/item1/i)).toBeInTheDocument();
      expect(screen.getByText(/Total cost: R0/)).toBeInTheDocument();
    });
  });

  test('handles zero quantity items in cart calculations', async () => {
    const zeroQuantityItems = [{name: 'Free Item', price: '10', quantity: '0'}];
    window.sessionStorage.setItem('cart_items', JSON.stringify(zeroQuantityItems));

    renderWithRouter(<Checkout/>);

    await waitFor(() => {
      expect(screen.getByText(/Total cost: R0/)).toBeInTheDocument();
      expect(screen.getByText(/Total count: 0/)).toBeInTheDocument();
    });
  });

  test('handles decimal total price in cart calculations', async () => {
    const decimalItems = [{name: 'Precision Item', price: '9.99', quantity: '2'}];
    window.sessionStorage.setItem('cart_items', JSON.stringify(decimalItems));

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText(/Total cost: R19.98/)).toBeInTheDocument();
    });
  });

  test('preserves payment state when navigating', async () => {
    const paymentItems = [{ name: 'State Item', price: '15', quantity: '1'}];
    window.sessionStorage.setItem('cart_items', JSON.stringify(paymentItems));

    renderWithRouter(<Checkout />);

    fireEvent.click(screen.getByText(/Proceed to Checkout/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/payment', {
        state: { total: 15 }
      });
    });
  });

  test('handles null cart items in session storage', async () => {
    window.sessionStorage.setItem('cart_items', 'null');

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty!/i)).toBeInTheDocument();
    });
  });

  test('handles very large quantity calculations', async () => {
    const largeQuantityItems = [
      {name: 'Bulk Item', price: '0.10', quantity: '1000'}];
    window.sessionStorage.setItem('cart_items', JSON.stringify(largeQuantityItems));

    renderWithRouter(<Checkout/>);

    await waitFor(() => {
      expect(screen.getByText(/Total cost: R100/)).toBeInTheDocument();
      expect(screen.getByText(/Total count: 1000/)).toBeInTheDocument();
    });
  });
});