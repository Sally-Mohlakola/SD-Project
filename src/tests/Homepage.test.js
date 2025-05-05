import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Homepage } from '../components/homepage';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getDocs, collection } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getProductsInShop } from '../components/myorders';

// Mock all of the above dependancies
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signOut: jest.fn()
}));

jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  getDocs: jest.fn(),
  collection: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

jest.mock('../components/myorders', () => ({
  getProductsInShop: jest.fn()
}));

// Mock data
const mockShops = [
  {
    id: 'shop1',
    nameofshop: 'Artisan Pottery',
    description: 'Handmade with love',
    category: 'Pottery',
    userid: 'user2'
  },{
    id: 'shop2',
    nameofshop: 'The Nile Shop',
    description: 'Red tempera clay products',
    category: 'Pottery',
    userid: 'user3'
  }
];

const mockProducts = [
  {
    id: 'prod1',
    name: 'Ceramic Plate',
    itemdescription: 'Hand-kneated clay plate',
    price: 45,
    quantity: 10
  },
  {
    id: 'prod2',
    name: 'Modern vase',
    itemdescription: 'Inspired by Modern Art',
    price: 120,
    quantity: 20
  }
];

describe('Homepage Component', () => {
  const navigation = jest.fn();
  let originalLocalStorage;
  let originalSessionStorage;

  beforeAll(() => {
    // Store original storage data
    originalLocalStorage = window.localStorage;
    originalSessionStorage = window.sessionStorage;
    
    // Mock the storage rather than using real storage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true
    });
    
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true
    });
  });

  afterAll(() => {
    // Restore original storage
    window.localStorage = originalLocalStorage;
    window.sessionStorage = originalSessionStorage;
  });
// Clear all the mocks to avoid history leaks to other tests rhat run independantly
  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigation);
    
    // Default mocks
    getDocs.mockResolvedValue({
      docs: mockShops.map(shop => ({
        id: shop.id,
        data: () => shop
      }))
    });
    
    getProductsInShop.mockResolvedValue(mockProducts);
    
    // Mock storage responses
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

  // Correct display of our homepage
  it('displays the homepage on its default view', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Natural Craft. Rooted in Care')).toBeInTheDocument();
    expect(screen.getByText('Featured Shops')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Shop the collection...')).toBeInTheDocument();
  });

  it('displays the loading message while fetching shops', async () => {
    getDocs.mockImplementation(() => new Promise(() => {}));
    
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Loading shops...')).toBeInTheDocument();
  });

  it('displays shops list after loading', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.getByText('Woodcraft')).toBeInTheDocument();
    });
  });

  it('filters shops based on the typed search query', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText('Shop the collection...');
    fireEvent.change(searchInput, { target: { value: 'pottery' } });

    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.queryByText('Artisan Pottery')).not.toBeInTheDocument();
    });
  });

  it('navigates to the shop view if "Enter Shop" is clicked', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

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

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(`Artisanal works of ${mockShops[0].nameofshop}`)).toBeInTheDocument();
      expect(screen.getByText('Ceramic Mug')).toBeInTheDocument();
      expect(screen.getByText('Ancient Pottery')).toBeInTheDocument();
    });
  });

  it('filters products by price', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const priceFilter = screen.getByLabelText('Filter by Price:');
      fireEvent.change(priceFilter, { target: { value: 'under50' } });
    });

    expect(screen.getByText('Ceramic Mug')).toBeInTheDocument();
    expect(screen.queryByText('Wooden Bowl')).not.toBeInTheDocument();
  });

  it('adds product to cart', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const buyButtons = screen.getAllByText('Buy');
      fireEvent.click(buyButtons[0]);
    });

    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '2' } });

    const addButton = screen.getByText('Add To Cart');
    fireEvent.click(addButton);

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      'cart_items',
      expect.any(String)
    );
  });

  it('shows confirmation when going back with items in the cart', async () => {
    window.confirm = jest.fn(() => true);
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      if (key === 'cart_items') return JSON.stringify([{ id: 'prod1', quantity: 1 }]);
      return null;
    });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
    });

    expect(window.confirm).toHaveBeenCalled();
    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith('cart_items');
  });

  it('navigates to checkout when cart icon is clicked', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    const cartIcon = screen.getByText(/Cart\(0\)/);
    fireEvent.click(cartIcon);

    expect(navigation).toHaveBeenCalledWith('/checkout');
  });

  it('logs out user when logout button is clicked', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    //Check if the logout leads the user to the auth page.
    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(signOut).toHaveBeenCalledWith(auth);
    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(navigation).toHaveBeenCalledWith('/');
  });

  it('handles error when fetching shops', async () => {
    const monitorConsole = jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValue(new Error('Failed to fetch'));

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(monitorConsole).toHaveBeenCalled();
    });
    
    monitorConsole.mockRestore();
  });

  it('displays empty state when no shops are found', async () => {
    getDocs.mockResolvedValue({ docs: [] });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No shops are listed yet.')).toBeInTheDocument();
  });

  it('displays empty state when no products are found', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    getProductsInShop.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText('No artisanal products.')).toBeInTheDocument();
  });

  it('displays cart item count', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'cart_items') return JSON.stringify([{}, {}]); // 2 items
      return null;
    });

    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText(/Cart\(2\)/)).toBeInTheDocument();
  });

  it('renders sidebar navigation links', async () => {
    render(
      <MemoryRouter>
        <Homepage />
      </MemoryRouter>
    );

    expect(await screen.findByText('My Shop')).toBeInTheDocument();
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
  });
});