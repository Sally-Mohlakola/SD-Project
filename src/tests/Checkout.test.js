import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkout } from '../components/checkout';
import { BrowserRouter } from 'react-router-dom';

// Wrap Checkout with Router for navigation
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Checkout Component', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test('renders empty cart message', () => {
    renderWithRouter(<Checkout />);
    expect(screen.getByText(/Your cart is empty!/i)).toBeInTheDocument();
  });

  test('renders cart items if present in sessionStorage', () => {
    const cartItems = [
      { name: 'Product A', itemdescription: 'Desc A', price: 100, quantity: 2 }
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));
    renderWithRouter(<Checkout />);

    expect(screen.getByText(/Name: Product A/i)).toBeInTheDocument();
    expect(screen.getByText(/Description: Desc A/i)).toBeInTheDocument();
    expect(screen.getByText(/Price: 200/i)).toBeInTheDocument();
    expect(screen.getByText(/Quantity: 2/i)).toBeInTheDocument();
  });

  test('removes item from cart', () => {
    const cartItems = [
      { name: 'Product B', itemdescription: 'Desc B', price: 50, quantity: 1 }
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));
    renderWithRouter(<Checkout />);
    
    const removeButton = screen.getByText(/Remove from cart/i);
    fireEvent.click(removeButton);
    
    expect(screen.getByText(/Your cart is empty!/i)).toBeInTheDocument();
  });

  test('shows total cost and number of items', () => {
    const cartItems = [
      { name: 'X', itemdescription: 'Y', price: 10, quantity: 3 },
      { name: 'Z', itemdescription: 'W', price: 5, quantity: 2 }
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));
    renderWithRouter(<Checkout />);
    
    expect(screen.getByText(/Total Cost: R40/i)).toBeInTheDocument();
    expect(screen.getByText(/Total number of items: 5/i)).toBeInTheDocument();
  });
});
