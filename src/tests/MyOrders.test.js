

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyOrders } from '../components/myorders';
import { getFunctions, httpsCallable } from 'firebase/functions';
test('should fail', () => {
  expect(true).toBe(false);
});
// Mock Firebase functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('MyOrders Component', () => {
  const mockOrders = [
    {
      orderid: 'order1',
      nameofshop: 'MyShop',
      status: 'Ordered',
      address: '123 Test St',
      products: [
        { nameofitem: 'Product 1', quantity: 2, price: 10 },
        { nameofitem: 'Product 2', quantity: 1, price: 20 },
      ],
    },
  ];

  const mockShops = [
    { id: 'shop1', userid: 'user123', name: 'MyShop' },
  ];

  const mockProducts = [
    { id: 'prod1', name: 'Product 1', price: 10 },
    { id: 'prod2', name: 'Product 2', price: 20 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLocalStorage.getItem
      .mockImplementation((key) => 
        key === 'userid' ? 'user123' : 
        key === 'shopname' ? 'MyShop' : 
        null
      );
    
    // Mock getOrders function
    httpsCallable.mockImplementation((functions, name) => {
      if (name === 'getOrders') {
        return jest.fn().mockResolvedValue({ data: { orders: mockOrders } });
      }
      if (name === 'getAllShops') {
        return jest.fn().mockResolvedValue({ data: { shops: mockShops } });
      }
      if (name === 'getProductsInShop') {
        return jest.fn().mockResolvedValue({ data: { docs: mockProducts } });
      }
      if (name === 'updateOrderStatus') {
        return jest.fn().mockResolvedValue({});
      }
      return jest.fn().mockRejectedValue(new Error('Function not found'));
    });
  });

  it('renders loading state initially', () => {
    render(<MyOrders />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no orders exist', async () => {
    httpsCallable.mockImplementationOnce(() => 
      jest.fn().mockResolvedValue({ data: { orders: [] } })
    );
    
    render(<MyOrders />);
    
    await waitFor(() => {
      expect(screen.getByText('You have no orders. Try again later.')).toBeInTheDocument();
    });
  });

  it('renders orders correctly', async () => {
    render(<MyOrders />);
    
    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Name: Product 1')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('Price: R10')).toBeInTheDocument();
      expect(screen.getByText('Address: 123 Test St')).toBeInTheDocument();
      expect(screen.getByText('Status: Ordered')).toBeInTheDocument();
    });
  });

  it('allows updating order status', async () => {
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update status'));
    });
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Dispatched' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'updateOrderStatus');
    });
  });

  it('cancels order status update', async () => {
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update status'));
    });
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
  });

  it('handles order collection', async () => {
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update status'));
    });
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Collected' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'updateOrderStatus');
    });
  });

  it('downloads CSV file', async () => {
    global.URL.createObjectURL = jest.fn();
    global.URL.revokeObjectURL = jest.fn();
    
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Download Sales Trends Report'));
    });
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('handles CSV download with no data', async () => {
    httpsCallable.mockImplementationOnce(() => 
      jest.fn().mockResolvedValue({ data: { orders: [] } })
    );
    
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Download Sales Trends Report'));
    });
    
    expect(alertMock).toHaveBeenCalledWith('No sales data available to download.');
  });

  it('navigates back to dashboard', async () => {
    const mockNavigate = jest.fn();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
    
    render(<MyOrders />);
    
    fireEvent.click(screen.getByText('← Dashboard'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
  });

  it('handles error when fetching orders', async () => {
    httpsCallable.mockImplementationOnce(() => 
      jest.fn().mockRejectedValue(new Error('Fetch error'))
    );
    
    console.error = jest.fn();
    
    render(<MyOrders />);
    
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Error fetching orders:', expect.any(Error));
    });
  });

  it('handles error when updating order status', async () => {
    httpsCallable.mockImplementationOnce((functions, name) => {
      if (name === 'updateOrderStatus') {
        return jest.fn().mockRejectedValue(new Error('Update error'));
      }
      return jest.fn().mockResolvedValue({ data: { orders: mockOrders } });
    });
    
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(<MyOrders />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText('Update status'));
    });
    
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Dispatched' } });
    fireEvent.click(screen.getByText('Save'));
    
    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to update this order status. Please try again.');
    });
  });
});