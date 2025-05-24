
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MyOrders, getProductsInShop } from './MyOrders';

// Mock dependancies
jest.mock('../styles/myorders.css', () => ({}));
jest.mock('../styles/searchTab.css', () => ({}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockLocalStorage = {
  getItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock the DOM for CSV download
const mockCreateElement = jest.spyOn(document, 'createElement');
const mockAppendChild = jest.spyOn(document.body, 'appendChild');
const mockRemoveChild = jest.spyOn(document.body, 'removeChild');
const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

// Mock the Blob for CSV data verification
const mockBlob = jest.fn();
global.Blob = mockBlob;

describe('MyOrders Component', () => {
  let mockGetOrders, mockGetAllShops, mockGetProductsFn, mockUpdateOrderStatus;

  beforeEach(() => {
    jest.clearAllMocks();

   s
    mockLocalStorage.getItem
      .mockImplementation((key) => (key === 'userid' ? 'user123' : key === 'shopname' ? 'MyShop' : null));

    mockGetOrders = jest.fn();
    mockGetAllShops = jest.fn();
    mockGetProductsFn = jest.fn();
    mockUpdateOrderStatus = jest.fn();

    // Mock called Cloud Functions
    httpsCallable.mockImplementation((_, name) => {
      if (name === 'getOrders') return mockGetOrders;
      if (name === 'getAllShops') return mockGetAllShops;
      if (name === 'getProductsInShop') return mockGetProductsFn;
      if (name === 'updateOrderStatus') return mockUpdateOrderStatus;
      return jest.fn();
    });

    // Mock default responses
    mockGetOrders.mockResolvedValue({
      data: {
        orders: [
          {
            orderid: 'order1',
            address: '123 Mock Street',
            nameofshop: 'MyShop',
            status: 'Ordered',
            userid: 'user123',
            products: [
              { nameofitem: 'Item A', price: 50, quantity: 2 },
              { nameofitem: 'Item B', price: 30, quantity: 1 },
            ],
          },
          {
            orderid: 'order2',
            address: '456 Test Street',
            nameofshop: 'MyShop',
            status: 'Dispatched',
            userid: 'user123',
            products: [
              { nameofitem: 'Item A', price: 50, quantity: 3 },
            ],
          },
        ],
      },
    });

    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [{ id: 'shop1', userid: 'user123' }],
      },
    });

    mockGetProductsFn.mockResolvedValue({
      data: {
        docs: [
          { id: 'prod1', name: 'Item A', price: 50, sold: 5 },
          { id: 'prod2', name: 'Item B', price: 30, sold: 1 },
        ],
      },
    });

    mockUpdateOrderStatus.mockResolvedValue({});

    // Mock Blob to capture CSV content
    mockBlob.mockImplementation((content, options) => ({
      content,
      options,
    }));
  });

  it('renders loading state initially', () => {
    render(<MyOrders />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders empty state when no orders exist', async () => {
    mockGetOrders.mockResolvedValueOnce({ data: { orders: [] } });
    render(<MyOrders />);
    await waitFor(() => {
      expect(screen.getByText('You have no orders. Try again later.')).toBeInTheDocument();
      expect(screen.queryByText('Order #order1')).not.toBeInTheDocument();
    });
  });

  it('renders orders correctly', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      expect(screen.getByText('Order #order1')).toBeInTheDocument();
      expect(screen.getByText('Order #order2')).toBeInTheDocument();
      expect(screen.getByText('Name: Item A')).toBeInTheDocument();
      expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
      expect(screen.getByText('Price: R50')).toBeInTheDocument();
      expect(screen.getByText('Address: 123 Main St')).toBeInTheDocument();
      expect(screen.getByText('Status: Ordered')).toBeInTheDocument();
      expect(screen.getByText('Status: Dispatched')).toBeInTheDocument();
    });
  });

  it('navigates to dashboard when back button is clicked', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('← Dashboard'));
      expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
    });
  });

  it('fetches and sets products for the user shop', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      expect(mockGetAllShops).toHaveBeenCalledTimes(1);
      expect(mockGetProductsFn).toHaveBeenCalledWith({ shopid: 'shop1' });
    });
  });

  it('handles no shops found for user', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });
    render(<MyOrders />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR: No shops found for this user.');
      expect(mockGetProductsFn).not.toHaveBeenCalled();
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles error when fetching orders fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetOrders.mockRejectedValueOnce(new Error('Fetch error'));
    render(<MyOrders />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching orders:', expect.any(Error));
      expect(screen.getByText('You have no orders. Try again later.')).toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('handles error when fetching products fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetProductsFn.mockRejectedValueOnce(new Error('Product fetch error'));
    render(<MyOrders />);
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR getting this shop or products:', expect.any(Error));
    });
    consoleErrorSpy.mockRestore();
  });

  it('updates order status successfully', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getAllByText('Update status')[0]);
    });
    const select = screen.getByRole('combobox');
    expect(select).toHaveValue('Ordered');
    fireEvent.change(select, { target: { value: 'Dispatched' } });
    expect(select).toHaveValue('Dispatched');
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderStatus: 'Dispatched',
        orderId: 'order1',
      });
      expect(screen.getByText('Status: Dispatched')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  it('removes order when status is set to Collected', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getAllByText('Update status')[0]);
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Collected' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderStatus: 'Collected',
        orderId: 'order1',
      });
      expect(mockAlert).toHaveBeenCalledWith('The order has been received by customer.');
      expect(screen.queryByText('Order #order1')).not.toBeInTheDocument();
      expect(screen.getByText('Order #order2')).toBeInTheDocument();
    });
  });

  it('cancels status update', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getAllByText('Update status')[0]);
    });
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    await waitFor(() => {
      expect(screen.getByText('Status: Ordered')).toBeInTheDocument();
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
  });

  it('handles error during status update', async () => {
    mockUpdateOrderStatus.mockRejectedValueOnce(new Error('Update error'));
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getAllByText('Update status')[0]);
    });
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Dispatched' } });
    fireEvent.click(screen.getByText('Save'));
    await waitFor(() => {
      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderStatus: 'Dispatched',
        orderId: 'order1',
      });
      expect(mockAlert).toHaveBeenCalledWith('Failed to update this order status. Please try again.');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating order status:', expect.any(Error));
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });
    consoleErrorSpy.mockRestore();
  });

  it('downloads CSV with sales trends', async () => {
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Download Sales Trends Report'));
    });
    expect(mockCreateElement).toHaveBeenCalledWith('a');
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockBlob).toHaveBeenCalled();
    const blobContent = mockBlob.mock.calls[0][0][0];
    const expectedCSV = [
      'productName,price,totalQuantity,totalRevenue,salesGrowthPercentage',
      '"Item A","50.00",5,250.00,100.00',
      '"Item B","30.00",1,30.00,-60.00',
    ].join('\n');
    expect(blobContent).toBe(expectedCSV);
  });

  it('alerts when no sales data is available for CSV', async () => {
    mockGetOrders.mockResolvedValueOnce({ data: { orders: [] } });
    render(<MyOrders />);
    await waitFor(() => {
      fireEvent.click(screen.getByText('Download Sales Trends Report'));
    });
    expect(mockAlert).toHaveBeenCalledWith('No sales data available to download.');
    expect(mockBlob).not.toHaveBeenCalled();
  });

  it('tests getProductsInShop success', async () => {
    const products = await getProductsInShop('shop1');
    expect(mockGetProductsFn).toHaveBeenCalledWith({ shopid: 'shop1' });
    expect(products).toEqual([
      { id: 'prod1', name: 'Item A', price: 50, sold: 5 },
      { id: 'prod2', name: 'Item B', price: 30, sold: 1 },
    ]);
  });

  it('tests getProductsInShop error handling', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    mockGetProductsFn.mockRejectedValueOnce(new Error('Product fetch error'));
    const products = await getProductsInShop('shop1');
    expect(products).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith('ERROR getting products: ', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('handles null localStorage values', async () => {
    mockLocalStorage.getItem.mockReset().mockImplementation(() => null);
    render(<MyOrders />);
    await waitFor(() => {
      expect(screen.getByText('You have no orders. Try again later.')).toBeInTheDocument();
    });
  });
});

// Add data-testid for loader
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'dataset', {
    writable: true,
    value: { testid: 'loader' },
  });
});
