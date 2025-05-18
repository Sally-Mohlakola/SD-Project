import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { auth, db, storage, provider } from '../config/firebase';
import { MyOrders,getProductsInShop } from '../components/myorders';
import { BrowserRouter } from 'react-router-dom';
import * as firestore from 'firebase/firestore';
import * as functions from 'firebase/functions';


jest.mock('../config/firebase', () => ({
  auth: {
    currentUser: { uid: 'mockUser' },
  },
  db: {},
  storage: {},
  provider: {},
}));

// Mock Firebase modules
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn(),
}));

// Sample mock data
const mockOrders = [
  {
    orderid: '1',
    nameofshop: 'ShopX',
    status: 'Ordered',
    address: '123 Street',
    products: [
      { name: 'Item1', quantity: 2, price: 100, nameofitem: 'Item1' },
    ],
  },
];

const mockShops = [
  { id: 'shop1', userid: 'user1' },
];

const mockProducts = [
  { id: 'p1', name: 'Item1', price: 100, sold: 10 },
];

describe('MyOrders Component', () => {
  beforeEach(() => {
    // Set up localStorage
    localStorage.setItem('userid', 'user1');
    localStorage.setItem('shopname', 'ShopX');

    // Mock Firebase functions
    functions.getFunctions.mockReturnValue({});
    functions.httpsCallable.mockImplementation((_, name) => {
      return jest.fn(() => {
        if (name === 'getOrders') return Promise.resolve({ data: { orders: mockOrders } });
        if (name === 'getAllShops') return Promise.resolve({ data: { shops: mockShops } });
        return Promise.resolve({ data: {} });
      });
    });

    // Mock Firestore getDocs
    firestore.getDocs.mockResolvedValue({
      docs: mockProducts.map(prod => ({ id: prod.id, data: () => prod })),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders orders correctly and updates status', async () => {
    render(<BrowserRouter><MyOrders /></BrowserRouter>);

    // Wait for orders to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Name:')).toBeInTheDocument();
      expect(screen.getByText('Item1')).toBeInTheDocument();
      expect(screen.getByText('R100')).toBeInTheDocument();
    });

    // Simulate updating order status
    fireEvent.click(screen.getByText('Update status'));
    fireEvent.change(screen.getByDisplayValue('Ordered'), {
      target: { value: 'Dispatched' },
    });
    fireEvent.click(screen.getByText('Save'));

    // Verify updateDoc was called
    await waitFor(() => {
      expect(firestore.updateDoc).toHaveBeenCalled();
    });
  });

  it('navigates back to dashboard', async () => {
    render(<BrowserRouter><MyOrders /></BrowserRouter>);

    const backButton = screen.getByText('← Dashboard');
    expect(backButton).toBeInTheDocument();
    fireEvent.click(backButton);
    // Navigation can be tested further with mock implementations
  });
});
describe('getProductsInShop', () => {
  it('fetches and returns products correctly', async () => {
    const shopid = 'shop1';
    const mockDocs = [
      { id: 'p1', data: () => ({ name: 'Prod1', price: 100 }) },
      { id: 'p2', data: () => ({ name: 'Prod2', price: 200 }) },
    ];
    firestore.collection.mockReturnValue('mockCollection');
    firestore.getDocs.mockResolvedValue({ docs: mockDocs });

    const products = await getProductsInShop(shopid);

    expect(firestore.collection).toHaveBeenCalledWith(db, "Shops", shopid, "Products");
    expect(firestore.getDocs).toHaveBeenCalledWith('mockCollection');
    expect(products).toEqual([
      { id: 'p1', name: 'Prod1', price: 100 },
      { id: 'p2', name: 'Prod2', price: 200 },
    ]);
  });

  it('returns empty array on error', async () => {
    firestore.getDocs.mockRejectedValue(new Error('fail'));
    const products = await getProductsInShop('shop1');
    expect(products).toEqual([]);
  });
});
it('calls getProductsInShop outside useEffect', () => {
  const spy = jest.spyOn(require('../components/myorders'), 'getProductsInShop').mockResolvedValue([]);
  render(<BrowserRouter><MyOrders /></BrowserRouter>);
  expect(spy).toHaveBeenCalledWith('user1');
  spy.mockRestore();
});
it('downloadCSVFIle creates and triggers download when button is clicked', async () => {
  // Mock any required data to make download button visible
  jest.spyOn(myordersModule, 'getProductsInShop').mockResolvedValue([
    { id: '1', name: 'A', price: 10, sold: 5 },
    { id: '2', name: 'B', price: 15, sold: 10 },
  ]);

  // Spy on download-related methods
  const createElementSpy = jest.spyOn(document, 'createElement');
  const appendChildSpy = jest.spyOn(document.body, 'appendChild');
  const removeChildSpy = jest.spyOn(document.body, 'removeChild');
  global.URL.createObjectURL = jest.fn(() => 'blob:fake-url');

  render(<BrowserRouter><MyOrders /></BrowserRouter>);

  // Wait for component to render properly
  const downloadBtn = await screen.findByRole('button', { name: /download/i });
  fireEvent.click(downloadBtn);

  expect(createElementSpy).toHaveBeenCalledWith('a');
  expect(appendChildSpy).toHaveBeenCalled();
  expect(removeChildSpy).toHaveBeenCalled();

  // Clean up
  createElementSpy.mockRestore();
  appendChildSpy.mockRestore();
  removeChildSpy.mockRestore();
});



