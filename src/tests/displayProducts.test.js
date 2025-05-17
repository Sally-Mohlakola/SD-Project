import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Displayproducts } from '../components/displayproducts';
import { getDocs, collection, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

jest.mock('../config/firebase.js', () => ({
  db: {},
  auth: {},
  provider: {},
  storage: {}
}));

// Mock Firebase services
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  getDocs: jest.fn(),
  where: jest.fn(),
}));

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({}),
}));

// Mock userinfo hook
jest.mock('../components/userinfo.js', () => ({
  useShopId: jest.fn(),
}));

describe('Displayproducts Component', () => {
  const mockProducts = [
    {
      imageURL: 'https://example.com/image1.jpg',
      name: 'Product 1',
      itemdescription: 'Description 1',
      price: 10,
      quantity: 5
    },
    {
      imageURL: 'https://example.com/image2.jpg',
      name: 'Product 2',
      itemdescription: 'Description 2',
      price: 20,
      quantity: 10
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    
    // Mock getDocs implementation
    getDocs.mockImplementation(() => ({
      forEach: (callback) => {
        mockProducts.forEach(product => {
          callback({ 
            id: 'doc123',
            data: () => product 
          });
        });
      }
    }));
  });

  it('renders loading state when shopid is not available', () => {
    render(<Displayproducts />);
    expect(screen.queryByText('My products')).not.toBeInTheDocument();
  });

  it('renders products when shopid is available', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    // Check if product data is rendered
    expect(await screen.findByText('My products')).toBeInTheDocument();
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Description 1')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    
    // Check if images are rendered
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
  });

  it('navigates to dashboard when dashboard button is clicked', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await screen.findByText('My products');
    fireEvent.click(screen.getByText('← Dashboard'));
    expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
  });

  it('navigates to add products page when add button is clicked', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await screen.findByText('My products');
    fireEvent.click(screen.getByText('Add product'));
    expect(mockNavigate).toHaveBeenCalledWith('/addproducts');
  });

  it('sets item in localStorage and navigates when update button is clicked', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await screen.findByText('My products');
    const updateButtons = screen.getAllByText('Update Product');
    fireEvent.click(updateButtons[0]);
    
    expect(localStorage.getItem('Item')).toBe('Product 1');
    expect(mockNavigate).toHaveBeenCalledWith('/updateproducts');
  });

  it('sets item in localStorage and navigates when remove button is clicked', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await screen.findByText('My products');
    const removeButtons = screen.getAllByText('Remove Product');
    fireEvent.click(removeButtons[0]);
    
    expect(localStorage.getItem('Item')).toBe('Product 1');
    expect(mockNavigate).toHaveBeenCalledWith('/removeproducts');
  });

  it('handles Firestore error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    getDocs.mockRejectedValueOnce(new Error('Firestore error'));
    
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('does not call getDocs when shopid is not available', () => {
    render(<Displayproducts />);
    expect(getDocs).not.toHaveBeenCalled();
  });

  it('correctly formats and displays product data', async () => {
    localStorage.setItem('shopid', 'shop123');
    render(<Displayproducts />);
    
    await waitFor(() => {
      expect(screen.getByText('Name: Product 1')).toBeInTheDocument();
      expect(screen.getByText('Description: Description 1')).toBeInTheDocument();
      expect(screen.getByText('Price: 10')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 5')).toBeInTheDocument();
    });
  });
});