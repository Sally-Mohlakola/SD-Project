import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteProduct } from '../components/removeproducts';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock react-router
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock Firebase functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn()
}));

// Setup mocks
const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);

const mockDeleteProduct = jest.fn();
httpsCallable.mockReturnValue(mockDeleteProduct);

// Setup fake localStorage
const localStorageMock = (() => {
  let store = {
    shopid: 'shop123',
    Item: 'Mock Product',
    productid: 'prod456',
    producturl: encodeURIComponent('/o/some/path/to/file.jpg?alt=media')
  };
  return {
    getItem: jest.fn((key) => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('DeleteProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with product name and buttons', () => {
    render(<DeleteProduct />);
    expect(screen.getByText(/Do you want to remove this product/i)).toBeInTheDocument();
    expect(screen.getByText(/Mock Product/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/Close/i)).toBeInTheDocument();
  });

  it('navigates back when Close button is clicked', () => {
    render(<DeleteProduct />);
    const closeButton = screen.getByText(/Close/i);
    fireEvent.click(closeButton);
    expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
  });

  it('calls deleteProduct and navigates after Confirm is clicked', async () => {
    mockDeleteProduct.mockResolvedValueOnce({});
    render(<DeleteProduct />);
    const confirmButton = screen.getByText(/Confirm/i);
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(getFunctions).toHaveBeenCalled();
      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'deleteProduct');
      expect(mockDeleteProduct).toHaveBeenCalledWith({
        shopId: 'shop123',
        productId: 'prod456',
        path: 'some/path/to/file.jpg'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('shows loading state while deleting', async () => {
    let resolveFn;
    mockDeleteProduct.mockImplementation(
      () => new Promise(resolve => (resolveFn = resolve))
    );
    render(<DeleteProduct />);
    fireEvent.click(screen.getByText(/Confirm/i));
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    resolveFn({});
    await waitFor(() => expect(mockNavigate).toHaveBeenCalled());
  });

  it('handles errors gracefully during deletion', async () => {
    mockDeleteProduct.mockRejectedValueOnce(new Error('Firebase error'));
    render(<DeleteProduct />);
    fireEvent.click(screen.getByText(/Confirm/i));
    await waitFor(() => {
      expect(mockDeleteProduct).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('waits for localStorage Item in useEffect (interval behavior)', async () => {
    jest.useFakeTimers();
    render(<DeleteProduct />);
    // Item already exists in mocked localStorage
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(localStorage.getItem).toHaveBeenCalledWith('Item');
    });
    jest.useRealTimers();
  });
});
