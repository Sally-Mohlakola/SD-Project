import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Inventory } from '../components/myinventory'; // Adjust path as needed
import { collection, getDocs, query } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import CsvDownloader from 'react-csv-downloader';

// Mock external dependencies
jest.mock('firebase/firestore');
jest.mock('../config/firebase', () => ({
  db: {},
}));
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));
jest.mock('react-csv-downloader', () => jest.fn(({ children }) => <button>{children}</button>));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


describe('Inventory Component', () => {
  const mockNavigate = jest.fn();
  // Set inventory fields
  const mockProducts = [
    {
      ImageUrl: 'image1.jpg',
      Name: 'Product 1',
      Price: '100',
      Quantity: '10',
      Sold: '5',
    },
    {
      ImageUrl: 'image2.jpg',
      Name: 'Product 2',
      Price: '200',
      Quantity: '3', // Should trigger restock warning
      Sold: '8',
    },
  ];

  // Clear mock data and set mock veriables
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    localStorageMock.getItem.mockReturnValue('test-shop-id');
    query.mockReturnValue('mock-query');
    collection.mockReturnValue('mock-collection');
    getDocs.mockResolvedValue({
      forEach: (callback) => {
        mockProducts.forEach((product) => {
          callback({
            data: () => ({
              imageURL: product.ImageUrl,
              name: product.Name,
              price: product.Price,
              quantity: product.Quantity,
              sold: product.Sold,
            }),
          });
        });
      },
    });
  });
// Clear cache from other tests to ensure tests run independantly on their defined mock data
  afterEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear.mockImplementation(() => {});
  });


  describe('Rendering', () => {
    it('renders loading state when no shop ID is available', async () => {
      localStorageMock.getItem.mockReturnValue(null); // No items are fetched for a missing shop ID
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      render(<Inventory />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Waiting for shop ID...'); // Console warning
      });
      
      expect(screen.getByText(/Inventory/i)).toBeInTheDocument();
      expect(screen.queryByText(/Product 1/i)).not.toBeInTheDocument();
      consoleSpy.mockRestore();
    });

    it('renders inventory with products when shop ID is available', async () => {
      render(<Inventory />);
      await waitFor(() => {
        expect(getDocs).toHaveBeenCalledWith('mock-query'); 
        expect(collection).toHaveBeenCalledWith({}, 'Shops', 'test-shop-id', 'Products');
        expect(query).toHaveBeenCalledWith('mock-collection');
      });

      // Get products from mock storage and present to UI
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      for (const product of mockProducts) {
        expect(screen.getByText(product.Name)).toBeInTheDocument();
        expect(screen.getByText(product.Price)).toBeInTheDocument();
        expect(screen.getByText(product.Quantity)).toBeInTheDocument();
        expect(screen.getByText(product.Sold)).toBeInTheDocument();
      }
    });

    // Expect images to have URLs
    it('displays product images correctly', async () => {
      render(<Inventory />);
      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images).toHaveLength(mockProducts.length + 1); // +1 for warning icon
        mockProducts.forEach((product) => {
          expect(screen.getByAltText(product.Name)).toHaveAttribute('src', product.ImageUrl);
        });
      });
    });
  });

  describe('Restock Warning', () => {
    it('shows restock warning for low quantity items', async () => {
      render(<Inventory />);
      await waitFor(() => {
        expect(screen.getByText(/Warning! You might want to stock up on these:/i)).toBeInTheDocument();
        expect(screen.getByText(/"Product 2" is running low \(Only 3 is left in stock\)/i)).toBeInTheDocument();
        expect(screen.queryByText(/"Product 1" is running low/i)).not.toBeInTheDocument();
      });
    });

    it('does not show restock warning when all quantities are sufficient', async () => {
      const highQuantityProducts = [
        {
          ImageUrl: 'image1.jpg',
          Name: 'Product 1',
          Price: '100',
          Quantity: '10',
          Sold: '5',
        },
        {
          ImageUrl: 'image2.jpg',
          Name: 'Product 2',
          Price: '200',
          Quantity: '6',
          Sold: '8',
        },
      ];

      getDocs.mockResolvedValue({
        forEach: (callback) => {
          highQuantityProducts.forEach((product) => {
            callback({
              data: () => ({
                imageURL: product.ImageUrl,
                name: product.Name,
                price: product.Price,
                quantity: product.Quantity,
                sold: product.Sold,
              }),
            });
          });
        },
      });

      render(<Inventory />);
      await waitFor(() => {
        expect(screen.queryByText(/Warning! You might want to stock up on these:/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to dashboard when button is clicked', async () => {
      render(<Inventory />);
      await waitFor(() => expect(getDocs).toHaveBeenCalled());
      fireEvent.click(screen.getByText(/← Dashboard/i));
      expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
    });
  });

  describe('CSV Download', () => {
    it('includes CSV download button with correct data', async () => {
      render(<Inventory />);
      await waitFor(() => {
        expect(CsvDownloader).toHaveBeenCalledWith(
          expect.objectContaining({
            filename: 'Inventory_items',
            datas: mockProducts,
            text: 'Download Inventory CSV',
          }),
          expect.anything()
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('handles Firestore error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      getDocs.mockRejectedValue(new Error('Firestore error'));
      render(<Inventory />);
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching products'));
      });
      consoleSpy.mockRestore();
    });
  });
});