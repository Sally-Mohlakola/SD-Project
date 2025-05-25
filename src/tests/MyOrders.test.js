import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyOrders } from '../components/myorders';
import * as firebaseFunctions from 'firebase/functions';
import { BrowserRouter } from 'react-router-dom';

// 🔥 MOCK firebase/functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn()
}));

// 🧭 MOCK useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// 🗂️ MOCK localStorage
beforeEach(() => {
  Storage.prototype.getItem = jest.fn((key) => {
    if (key === 'userid') return 'test-user-id';
    if (key === 'shopname') return 'test-shop-name';
    return null;
  });
});

describe('MyOrders Component', () => {
  const mockOrders = {
    data: {
      orders: [{
        orderid: '123',
        nameofshop: 'test-shop-name',
        address: '123 Test Street',
        status: 'Ordered',
        products: [
          { nameofitem: 'Apple', quantity: 2, price: 10 }
        ]
      }]
    }
  };

  const mockShops = {
    data: {
      shops: [{ id: 'shop123', userid: 'test-user-id' }]
    }
  };

  const mockProducts = {
    data: {
      docs: [
        { id: 'prod1', nameofitem: 'Apple', quantity: 2, price: 10 }
      ]
    }
  };

  let getOrdersFn, getAllShopsFn, getProductsFn, updateOrderStatusFn;

  beforeEach(() => {
    getOrdersFn = jest.fn().mockResolvedValue(mockOrders);
    getAllShopsFn = jest.fn().mockResolvedValue(mockShops);
    getProductsFn = jest.fn().mockResolvedValue(mockProducts);
    updateOrderStatusFn = jest.fn().mockResolvedValue({});

    firebaseFunctions.httpsCallable.mockImplementation((_, fnName) => {
      if (fnName === 'getOrders') return getOrdersFn;
      if (fnName === 'getAllShops') return getAllShopsFn;
      if (fnName === 'getProductsInShop') return getProductsFn;
      if (fnName === 'updateOrderStatus') return updateOrderStatusFn;
    });

    firebaseFunctions.getFunctions.mockReturnValue({});
  });

  it('renders order list and updates status', async () => {
    render(<BrowserRouter><MyOrders /></BrowserRouter>);

    // Wait for the orders to load
    expect(await screen.findByText(/Order #1/i)).toBeInTheDocument();
    expect(screen.getByText(/Apple/)).toBeInTheDocument();

    // Click update status
    fireEvent.click(screen.getByText(/Update status/i));

    // Change select input and save
    fireEvent.change(screen.getByDisplayValue('Ordered'), {
      target: { value: 'Collected' }
    });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(updateOrderStatusFn).toHaveBeenCalledWith({
        orderStatus: 'Collected',
        orderId: '123'
      });
    });
  });

  it('navigates to dashboard', async () => {
    render(<BrowserRouter><MyOrders /></BrowserRouter>);
    const btn = await screen.findByText(/← Dashboard/i);
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
  });

  it('downloads CSV when button clicked', async () => {
    render(<BrowserRouter><MyOrders /></BrowserRouter>);
    const downloadBtn = await screen.findByText(/Download Sales Trends Report/i);
    // mock Blob and anchor behavior
    const createElementSpy = jest.spyOn(document, 'createElement');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    createElementSpy.mockReturnValue({
      click: jest.fn(),
      href: '',
      download: '',
      style: {},
    });

    fireEvent.click(downloadBtn);
    expect(createElementSpy).toHaveBeenCalledWith('a');

    // cleanup
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });
});
