import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MyShop } from '../components/myshop';

// Mock all dependancies

// Mock Firebase completely
jest.mock('../config/firebase', () => ({
  db: {}, storage: {}, app: {}, auth: {
    currentUser: { uid: 'user123' }
  }
}));

//Firebase Cloud Functions
const mockGetAllShops = jest.fn();
const mockDeleteShop = jest.fn();

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn((_, name) => {
    if (name === 'getAllShops') return mockGetAllShops;
    if (name === 'deleteShop') return mockDeleteShop;
    return jest.fn();
  })
}));

//firebase/firestore and firebase/storage
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(), deleteDoc: jest.fn(), doc: jest.fn()
}));

jest.mock('firebase/storage', () => ({
  deleteObject: jest.fn(),
  ref: jest.fn()
}));

// Mock react-router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to} data-testid="router-link">{children}</a>,
}));

describe('MyShop component', () => {
  beforeEach(() => {
    // Clear all mocks and set localStorage
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('userid', 'u123');

    // Reset console.error mock to avoid test noise
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    // Restore console.error
    console.error.mockRestore();
  });

  test('renders loading state initially', async () => {
    // Don't resolve the mockGetAllShops promise yet
    mockGetAllShops.mockImplementation(() => new Promise(() => { }));

    const { container } = render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    // Should render an empty section while loading
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  test('renders no shop message when user has no shop', async () => {
    mockGetAllShops.mockResolvedValue({
      data: { shops: [] }
    });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You dont have a shop yet/i)).toBeInTheDocument();
    });

    const startButton = screen.getByText(/Start my shop?/i);
    expect(startButton).toBeInTheDocument();

    // Test navigation on button click
    fireEvent.click(startButton);
    expect(mockNavigate).toHaveBeenCalledWith('/createshop');
  });

  test('renders awaiting approval message when shop status is Awaiting', async () => {
    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [{
          id: 'shop1',
          userid: 'u123',
          nameofshop: 'Test Shop',
          description: 'Test description',
          status: 'Awaiting',
          imageurl: 'test-image.jpg'
        }]
      }
    });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/The admin has not cleared your store yet!/i)).toBeInTheDocument();
    });

    const homeLink = screen.getByText(/Home/i);
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.getAttribute('href')).toBe('/homepage');
  });

  test('navigates to dashboard when shop status is Accepted', async () => {
    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [{
          id: 'shop1',
          userid: 'u123',
          nameofshop: 'Test Shop',
          description: 'Test description',
          status: 'Accepted',
          imageurl: 'test-image.jpg'
        }]
      }
    });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
    });
  });

  test('shows rejection message and delete button when shop status is Rejected', async () => {
    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [{
          id: 'shop1',
          userid: 'u123',
          nameofshop: 'Test Shop',
          description: 'Test description',
          status: 'Rejected',
          imageurl: 'test-url'
        }]
      }
    });

    mockDeleteShop.mockResolvedValue({ data: { message: 'Deleted' } });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your request to open a store was rejected/i)).toBeInTheDocument();
    });

    const reapplyButton = screen.getByText(/Apply to open shop again/i);
    expect(reapplyButton).toBeInTheDocument();

    fireEvent.click(reapplyButton);

    await waitFor(() => {
      expect(mockDeleteShop).toHaveBeenCalledWith({
        shopId: 'shop1',
        userId: 'u123',
        url: 'test-url'
      });
      expect(mockNavigate).toHaveBeenCalledWith('/createshop');
    });
  });

  test('handles case when no user ID is found in localStorage', async () => {
    localStorage.removeItem('userid');

    mockGetAllShops.mockResolvedValue({
      data: { shops: [] }
    });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/You dont have a shop yet/i)).toBeInTheDocument();
    });
  });

  test('handles error when fetching shops from Firebase', async () => {
    mockGetAllShops.mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('handles error when deleting a rejected shop', async () => {
    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [{
          id: 'shop1',
          userid: 'u123',
          nameofshop: 'Test Shop',
          description: 'Test description',
          status: 'Rejected',
          imageurl: 'test-url'
        }]
      }
    });

    mockDeleteShop.mockRejectedValue(new Error('Delete error'));

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Your request to open a store was rejected/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Apply to open shop again/i));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error deleting shop:", expect.any(Error));
    });
  });

  test('handles multiple shops in the data but finds the correct user shop', async () => {
    mockGetAllShops.mockResolvedValue({
      data: {
        shops: [
          {
            id: 'shop1', userid: 'user123', nameofshop: 'shop123', description: 'description',
            status: 'Accepted', imageurl: 'shopimage.jpg'
          }, {
            id: 'shop2', nuserid: 'user456', nameofshop: 'shop456', description: 'description',
            status: 'Accepted', imageurl: 'shopimage.jpg'
          }
        ]
      }
    });

    render(
      <MemoryRouter>
        <MyShop />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/The admin has not cleared your store yet!/i)).toBeInTheDocument();
    });
  });
});
