import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Displayproducts } from '../components/displayproducts';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn()
}));

// Mock Firebase functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn()
}));

// Mock firebase config
jest.mock('../config/firebase', () => ({
  app: {}, // mock the firebase app object
  auth: {}, // optional mocks if needed elsewhere
  provider: {},
  db: {},
  storage: {},
}));

//Mock firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() =>
    jest.fn(() =>
      Promise.resolve({
        data: [
          {
            name: 'Mock Product',
            imageURL: 'https://mockurl.com/image.jpg',
            itemdescription: 'Test description',
            price: 99.99,
            quantity: 5,
            id: 'mock-id',
          },
        ],
      })
    )
  ),
}));

const mockNavigate = jest.fn();
useNavigate.mockReturnValue(mockNavigate);

const mockGetProducts = jest.fn();
httpsCallable.mockReturnValue(mockGetProducts);

// Mock localStorage
const localStorageMock = (() => {
  let store = {
    shopid: 'shop123'
  };
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    clear: jest.fn(() => { store = {}; }),
    removeItem: jest.fn(key => { delete store[key]; })
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Displayproducts Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    mockGetProducts.mockResolvedValueOnce({ data: [] });
    render(<Displayproducts />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetProducts).toHaveBeenCalled());
  });

  it('displays fetched products', async () => {
    const sampleProducts = [
      {
        name: 'Product A',
        itemdescription: 'Nice item',
        price: '10',
        quantity: '5',
        imageURL: 'https://example.com/img.jpg',
        id: '123'
      }
    ];
    mockGetProducts.mockResolvedValueOnce({ data: sampleProducts });
    render(<Displayproducts />);
    await waitFor(() => screen.getByText(/Product A/i));
    expect(screen.getByText(/Nice item/i)).toBeInTheDocument();
  });

  it('navigates to dashboard on button click', () => {
    render(<Displayproducts />);
    fireEvent.click(screen.getByText(/Dashboard/i));
    expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
  });

  it('handles update button click and navigates', async () => {
    const product = {
      name: 'Product A',
      itemdescription: 'Nice item',
      price: '10',
      quantity: '5',
      imageURL: 'url',
      id: 'id1'
    };
    mockGetProducts.mockResolvedValueOnce({ data: [product] });
    render(<Displayproducts />);
    await waitFor(() => screen.getByText(/Update Product/i));
    fireEvent.click(screen.getByText(/Update Product/i));
    expect(mockNavigate).toHaveBeenCalledWith('/updateproducts');
    expect(localStorage.setItem).toHaveBeenCalledWith('Item', 'Product A');
    expect(localStorage.setItem).toHaveBeenCalledWith('productupdateid', 'id1');
  });

  it('handles delete button click and navigates', async () => {
    const product = {
      name: 'Product A',
      itemdescription: 'Nice item',
      price: '10',
      quantity: '5',
      imageURL: 'url',
      id: 'id1'
    };
    mockGetProducts.mockResolvedValueOnce({ data: [product] });
    render(<Displayproducts />);
    await waitFor(() => screen.getByText(/Remove Product/i));
    fireEvent.click(screen.getByText(/Remove Product/i));
    expect(mockNavigate).toHaveBeenCalledWith('/removeproducts');
    expect(localStorage.setItem).toHaveBeenCalledWith('Item', 'Product A');
    expect(localStorage.setItem).toHaveBeenCalledWith('productid', 'id1');
    expect(localStorage.setItem).toHaveBeenCalledWith('producturl', 'url');
  });

  it('handles Add Product button click', () => {
    render(<Displayproducts />);
    fireEvent.click(screen.getByText(/Add product/i));
    expect(mockNavigate).toHaveBeenCalledWith('/addproducts');
  });
});
