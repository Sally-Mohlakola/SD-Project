import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Homepage } from '../components/homepage';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getProductsInShop } from '../components/myorders';

// Mock all dependencies
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signOut: jest.fn(() => Promise.resolve()),
  getAuth: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  getDocs: jest.fn(),
  collection: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

jest.mock('../components/myorders', () => ({
  getProductsInShop: jest.fn(),
}));

// Mock data
const mockShops = [
  {
    id: 'shop1',
    nameofshop: 'Artisan Pottery',
    description: 'Handmade with love',
    category: 'Pottery',
    userid: 'user2',
  },
  {
    id: 'shop2',
    nameofshop: 'The Nile Shop',
    description: 'Red tempera clay products',
    category: 'Pottery',
    userid: 'user3',
  },
];

const mockProducts = [
  {
    id: 'prod1',
    name: 'Ceramic Plate',
    itemdescription: 'Hand-kneated clay plate',
    price: 45,
    quantity: 10,
  },
  {
    id: 'prod2',
    name: 'Modern vase',
    itemdescription: 'Inspired by Modern Art',
    price: 120,
    quantity: 20,
  },
];

describe('Homepage Component', () => {
  const mockNavigate = jest.fn();
  const originalWindowConfirm = window.confirm;

  beforeAll(() => {
    // Mock window confirm
    window.confirm = jest.fn(() => true);
    
    // Mock localStorage and sessionStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  afterAll(() => {
    // Restore original confirm
    window.confirm = originalWindowConfirm;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    
    getDocs.mockResolvedValue({
      docs: mockShops.map((shop) => ({
        id: shop.id,
        data: () => shop,
      })),
    });

    getProductsInShop.mockResolvedValue(mockProducts);
    
    // Default storage mocks
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'userid') return 'user1';
      if (key === 'shopname') return 'Test Shop';
      return null;
    });

    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'cart_items') return JSON.stringify([]);
      if (key === 'chosenshop') return null;
      return null;
    });
  });

  const renderHomepage = () => {
    return render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );
  };

  it('renders homepage with default view', async () => {
    renderHomepage();
    
    expect(await screen.findByText('Natural Craft. Rooted in Care')).toBeInTheDocument();
    expect(screen.getByText('Featured Shops')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Shop the collection...')).toBeInTheDocument();
  });

  it('shows loading state while fetching shops', async () => {
    getDocs.mockImplementation(() => new Promise(() => {}));
    
    renderHomepage();
    expect(await screen.findByText('Loading shops...')).toBeInTheDocument();
  });

  it('displays shops after loading', async () => {
    renderHomepage();
    
    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.getByText('The Nile Shop')).toBeInTheDocument();
    });
  });

  it('filters shops based on search query', async () => {
    renderHomepage();
    
    const searchInput = screen.getByPlaceholderText('Shop the collection...');
    fireEvent.change(searchInput, { target: { value: 'Artisan' } });
    
    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.queryByText('The Nile Shop')).not.toBeInTheDocument();
    });
  });

  it('navigates to shop view when "Enter Shop" is clicked', async () => {
    renderHomepage();
    
    await waitFor(() => {
      const enterButtons = screen.getAllByText('Enter Shop');
      fireEvent.click(enterButtons[0]);
    });
    
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'chosenshop',
      JSON.stringify(mockShops[0])
    );
  });

  it('displays products when a shop is selected', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    renderHomepage();
    
    await waitFor(() => {
      expect(screen.getByText(`Artisanal works of ${mockShops[0].nameofshop}`)).toBeInTheDocument();
      expect(screen.getByText('Ceramic Plate')).toBeInTheDocument();
      expect(screen.getByText('Modern vase')).toBeInTheDocument();
    });
  });

  it('filters products by price range', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    renderHomepage();
    
    await waitFor(() => {
      const priceFilter = screen.getByLabelText('Filter by Price:');
      fireEvent.change(priceFilter, { target: { value: 'under50' } });
    });
    
    expect(screen.getByText('Ceramic Plate')).toBeInTheDocument();
    expect(screen.queryByText('Modern vase')).not.toBeInTheDocument();
  });

  it('adds product to cart with quantity', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    renderHomepage();
    
    await waitFor(() => {
      const buyButton = screen.getAllByText('Buy');
      fireEvent.click(buyButton[0]);
    });
    
    const quantityofitem = screen.getByRole('spinbutton');
    fireEvent.change(quantityofitem, { target: { value: '2' } });
    
    const addButton = screen.getByText('Add To Cart');
    fireEvent.click(addButton);
    
    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'cart_items',
      expect.any(String)
    );
  });

  it('shows confirmation when going back with items in cart', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      if (key === 'cart_items') return JSON.stringify([{ id: 'prod1', quantity: 1 }]);
      return null;
    });
    
    renderHomepage();
    
    await waitFor(() => {
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
    });
    
    expect(window.confirm).toHaveBeenCalled();
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('cart_items');
  });

  it('navigates to checkout when cart icon is clicked', async () => {
    renderHomepage();
    
    const cartIcon = screen.getByText(/Cart\(0\)/);
    fireEvent.click(cartIcon);
    
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('logs out user when logout button is clicked', async () => {
    renderHomepage();
    
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(signOut).toHaveBeenCalledWith(auth);
    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles error when fetching shops', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Failed to fetch'));
    
    renderHomepage();
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('displays empty state when no shops found', async () => {
    getDocs.mockResolvedValue({ docs: [] });
    
    renderHomepage();
    
    expect(await screen.findByText('No shops are listed yet.')).toBeInTheDocument();
  });

  it('displays empty state when no products found', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    getProductsInShop.mockResolvedValue([]);
    
    renderHomepage();
    
    expect(await screen.findByText('No artisanal products.')).toBeInTheDocument();
  });

  it('displays correct cart item count', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'cart_items') return JSON.stringify([{}, {}]); // 2 items
      return null;
    });
    
    renderHomepage();
    
    expect(await screen.findByText(/Cart\(2\)/)).toBeInTheDocument();
  });

  it('renders all navigation links', async () => {
    renderHomepage();
    
    expect(await screen.findByText('My Shop')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});