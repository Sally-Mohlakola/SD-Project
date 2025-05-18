// ShopHomepage.test.jsx
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ShopHomepage } from './../components/shophomepage';

// Mock react-router-dom Link component
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock firebase/functions
const mockGetAllShops = jest.fn();
const mockFindShopImage = jest.fn();

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn((functions, name) => {
    if (name === 'getAllShops') return mockGetAllShops;
    if (name === 'findShopImage') return mockFindShopImage;
  }),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Helper to reset mocks and localStorage before each test
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('ShopHomepage', () => {
  test('renders loading initially and fetches shops successfully with no user shop', async () => {
    // Setup mocks
    localStorage.setItem('userid', 'user-123');
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });

    render(<ShopHomepage />);

    // Loading state shown first
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // Wait for shops to load and component to update
    await waitFor(() => {
      expect(mockGetAllShops).toHaveBeenCalledTimes(1);
    });

    // After loading, welcome should show empty storename (no user shop)
    expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    expect(screen.getByText('Welcome ')).toBeInTheDocument();

    // Because no shop matched currentUserId, image loading should not exist
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders user shop name and image after successful fetch and image retrieval', async () => {
    localStorage.setItem('userid', 'user-123');
    const shops = [
      {
        userid: 'user-123',
        nameofshop: 'Test Shop',
        imageurl: 'fake-url',
      },
    ];
    mockGetAllShops.mockResolvedValueOnce({ data: { shops } });
    mockFindShopImage.mockResolvedValueOnce({ data: { imageUrl: 'http://image-url.com/shop.png' } });

    render(<ShopHomepage />);

    await waitFor(() => {
      expect(mockGetAllShops).toHaveBeenCalled();
      expect(mockFindShopImage).toHaveBeenCalledWith({ url: 'fake-url' });
    });

    expect(screen.getByText('Welcome  Test Shop')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'http://image-url.com/shop.png');

    // localStorage should be updated with shopname
    expect(localStorage.setItem).toHaveBeenCalledWith('shopname', 'Test Shop');

    // Links should be rendered properly
    expect(screen.getByText('My Products').closest('a')).toHaveAttribute('href', '/displayproducts');
    expect(screen.getByText('My Orders').closest('a')).toHaveAttribute('href', '/myorders');
    expect(screen.getByText('Inventory').closest('a')).toHaveAttribute('href', '/myinventory');
    expect(screen.getByText('Home').closest('a')).toHaveAttribute('href', '/homepage');
  });

  test('handles error during getAllShops call gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('userid', 'user-123');
    mockGetAllShops.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<ShopHomepage />);

    await waitFor(() => {
      expect(mockGetAllShops).toHaveBeenCalled();
    });

    // Still loading is false because setLoading(false) is never called, but no crash
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  test('handles error during findShopImage call gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('userid', 'user-123');
    const shops = [
      {
        userid: 'user-123',
        nameofshop: 'Test Shop',
        imageurl: 'fake-url',
      },
    ];
    mockGetAllShops.mockResolvedValueOnce({ data: { shops } });
    mockFindShopImage.mockRejectedValueOnce(new Error('Image not found'));

    render(<ShopHomepage />);

    await waitFor(() => {
      expect(mockFindShopImage).toHaveBeenCalled();
    });

    // The imageExists state should be false due to error
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    consoleErrorSpy.mockRestore();
  });
});
