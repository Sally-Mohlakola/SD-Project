import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Checkout } from '../components/checkout';
import * as ReactRouterDom from 'react-router-dom';

// Mocking the navigation for tests
jest.mock('react-router-dom', () => {
  const react = jest.requireActual('react-router-dom');
  return {
    ...react,
    useNavigate: jest.fn(),
  };
});


const mockNavigate = jest.fn();

const renderWithRouter = (component, { route = '/checkout' } = {}) => {
  window.history.pushState({}, 'test', route);
  return render(component, { wrapper: MemoryRouter });
};

// Clean up any cache before each test to avoid leaks
beforeEach(() => {
  ReactRouterDom.useNavigate.mockReturnValue(mockNavigate);
  window.sessionStorage.clear();  
  mockNavigate.mockClear();      
});

describe('Checkout Page Tests', () => {
  test('should show items in cart', async () => {
    const testItems = [
    {
      name: 'Tempera painted vase',
      itemdescription: 'Great vase',
      price: '12',
      quantity: '20'
      },
      {
        name: 'Artisanal vase',
        itemdescription: 'Great vase',
        price: '7',
        quantity: '6'
      }
    ];
    window.sessionStorage.setItem('cart_items', JSON.stringify(testItems));
    window.sessionStorage.setItem('chosenshop', 'Shop');

    renderWithRouter(<Checkout />);

    // Check if items appear
    await waitFor(() => {
      expect(screen.getByText(/Vase/i)).toBeInTheDocument();
      expect(screen.getByText(/vase/i)).toBeInTheDocument();
    });

    // Verify totals
    expect(screen.getByText(/Total cost: R54/)).toBeInTheDocument();
    expect(screen.getByText(/Total count: 5/)).toBeInTheDocument();
  });

  test('removing item should reflect in cart', async () => {
    const thisItem = [
      {
        name: 'vASE',
        itemdescription: 'Ancient-inspired vase',
        price: '25',
        quantity: '3'
      }
    ];
    window.sessionStorage.setItem('cart_items', JSON.stringify(thisItem));

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText(/Vase/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Remove from cart/i));

    //Checking that the cart is empty at 0 items
    await waitFor(() => {
      expect(screen.getByText(/Your cart is empty!/i)).toBeInTheDocument();
    });

    //Check session storage
    expect(window.sessionStorage.getItem('cart_items')).toBe('[]');
  });

  test('this clears the shop memory from cart if the last item removed', async () => {
    const lastItem = [{
    name: 'Final item',
      itemdescription: 'This is a test item',
      price: '10',
      quantity: '1'
    }];
    window.sessionStorage.setItem('cart_items', JSON.stringify(lastItem));
    window.sessionStorage.setItem('chosenshop', 'FinalShop');

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      expect(screen.getByText(/Last Item/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Remove from cart/i));

    await waitFor(() => {
      expect(window.sessionStorage.getItem('chosenshop')).toBeNull();
    });
  });

  test('the back button nav  to homepage', async () => {
    const testItems = [{
      name: 'Test Item',
      price: '10',
      quantity: '2'
    }];
    window.sessionStorage.setItem('cart_items', JSON.stringify(testItems));

    renderWithRouter(<Checkout />);

    // Click back
    fireEvent.click(screen.getByText(/Back/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/homepage');
    });
  });

  test('empty cart shows proper message', () => {
    renderWithRouter(<Checkout />);
    
    //Shouldnt show total cost
    expect(screen.queryByText(/Total Cost:/i)).not.toBeInTheDocument();
    
    //Should show empty message
    expect(screen.getByText(/Your cart is empty!/i)).toBeInTheDocument();
  });

  test('invalid cart data shows error', async () => {
    // Mock console.error to track it
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Set bad data
    window.sessionStorage.setItem('cart_items', 'not-valid-json');

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    // Clean up mock
    consoleSpy.mockRestore();
  });

  test('checkout with empty cart shows alert', () => {
    // Mock window.alert
    window.alert = jest.fn();
    
    renderWithRouter(<Checkout />);
    
    // Try to checkout
    fireEvent.click(screen.getByText(/Checkout/i));
    
    expect(window.alert).toHaveBeenCalledWith(
      'Your cart is empty. Add items to your cart before proceeding to payment.'
    );
  });

  test('successful checkout clears cart', async () => {
    const checkoutItems = [{
      name: 'Final Product',
      price: '20',
      quantity: '1'
    }];
    window.sessionStorage.setItem('cart_items', JSON.stringify(checkoutItems));

    renderWithRouter(<Checkout />);

    await waitFor(() => {
      fireEvent.click(screen.getByText(/Proceed to Checkout/i));
    });

    await waitFor(() => {
      // Should navigate to payment
      expect(mockNavigate).toHaveBeenCalledWith('/payment', { state: { total: 20 } });
      
      // Cart should be empty
      expect(window.sessionStorage.getItem('cart_items')).toBe('[]');
    });
  });
});