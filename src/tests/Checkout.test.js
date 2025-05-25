// Checkout.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Checkout } from '../components/checkout';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Checkout Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  test('renders empty cart message when no items', () => {
    render(<Checkout />, { wrapper: MemoryRouter });

    // The UI elements available
    expect(screen.getByText(/checkout/i)).toBeInTheDocument();
    expect(screen.getByText(/your cart is empty!/i)).toBeInTheDocument();
    expect(screen.queryByText(/remove from cart/i)).not.toBeInTheDocument();
  });

  test('loads cart items from sessionStorage and displays them', () => {
    const cartItems = [
      { name: 'Apple', itemdescription: 'Fresh apple', price: '10', quantity: '2' },
      { name: 'Banana', itemdescription: 'Yellow banana', price: '5', quantity: '3' },
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));

    render(<Checkout />, { wrapper: MemoryRouter });

    expect(screen.getByText(/apple/i)).toBeInTheDocument();
    expect(screen.getByText(/banana/i)).toBeInTheDocument();
    expect(screen.getAllByText(/remove from cart/i).length).toBe(2);

    // Total cost and total items
    expect(screen.getByText(/total cost: r35/i)).toBeInTheDocument(); // (10*2)+(5*3)=35
    expect(screen.getByText(/total number of items: 5/i)).toBeInTheDocument();
  });

  test('handles invalid JSON in sessionStorage gracefully', () => {
    sessionStorage.setItem('cart_items', 'not a json');

    // spy on console.error to check error handling
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<Checkout />, { wrapper: MemoryRouter });

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(screen.getByText(/your cart is empty!/i)).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  test('removes item from cart and updates sessionStorage and UI', () => {
    const cartItems = [
      { name: 'Apple', itemdescription: 'Fresh apple', price: '10', quantity: '2' },
      { name: 'Banana', itemdescription: 'Yellow banana', price: '5', quantity: '3' },
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));
    sessionStorage.setItem('chosenshop', 'Shop123');

    render(<Checkout />, { wrapper: MemoryRouter });

    // Click remove button on first item (Apple)
    const removeButtons = screen.getAllByText(/remove from cart/i);
    fireEvent.click(removeButtons[0]);

    // Apple removed, only Banana remains
    expect(screen.queryByText(/apple/i)).not.toBeInTheDocument();
    expect(screen.getByText(/banana/i)).toBeInTheDocument();

    // sessionStorage updated
    const storedCart = JSON.parse(sessionStorage.getItem('cart_items'));
    expect(storedCart.length).toBe(1);
    expect(storedCart[0].name).toBe('Banana');

    // chosenshop remains because cart not empty
    expect(sessionStorage.getItem('chosenshop')).toBe('Shop123');
  });

  test('removing last item clears chosenshop from sessionStorage', () => {
    const cartItems = [
      { name: 'Apple', itemdescription: 'Fresh apple', price: '10', quantity: '2' }
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));
    sessionStorage.setItem('chosenshop', 'Shop123');

    render(<Checkout />, { wrapper: MemoryRouter });

    // Remove last item
    fireEvent.click(screen.getByText(/remove from cart/i));

    expect(screen.queryByText(/apple/i)).not.toBeInTheDocument();
    expect(screen.getByText(/your cart is empty!/i)).toBeInTheDocument();

    // cart_items updated to empty array string or removed
    expect(sessionStorage.getItem('cart_items')).toBe('[]');

    // chosenshop removed
    expect(sessionStorage.getItem('chosenshop')).toBe(null);
  });

  test('back button calls navigate to /homepage', () => {
    render(<Checkout />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/back/i));
    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });

  test('proceed button navigates to /payment with total cost when cart has items', () => {
    const cartItems = [
      { name: 'Apple', itemdescription: 'Fresh apple', price: '10', quantity: '2' }
    ];
    sessionStorage.setItem('cart_items', JSON.stringify(cartItems));

    render(<Checkout />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/proceed to checkout/i));

    expect(mockNavigate).toHaveBeenCalledWith('/payment', { state: { total: 20 } });
  });

  test('proceed button shows alert when cart is empty', () => {
    window.alert = jest.fn();

    render(<Checkout />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/proceed to checkout/i));

    expect(window.alert).toHaveBeenCalledWith("Your cart is empty. Add items to your cart before proceeding to payment.");
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
