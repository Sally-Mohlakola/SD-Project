import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Homepage } from '../components/homepage';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';

// Mock all dependencies
jest.mock('firebase/auth', () => ({
  ...jest.requireActual('firebase/auth'),
  signOut: jest.fn(() => Promise.resolve()),
  getAuth: jest.fn(() => ({})),
}));

jest.mock('firebase/functions', () => ({
  ...jest.requireActual('firebase/functions'),
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock data
const mockShops = [
  {
    id: 'shop1',
    nameofshop: 'Artisan Pottery',
    description: 'Handmade with love',
    category: 'Pottery',
    userid: 'user2',
    imageurl: 'image1.jpg'
  },
  {
    id: 'shop2',
    nameofshop: 'The Nile Shop',
    description: 'Red tempera clay products',
    category: 'Leatherwork',
    userid: 'user3',
    imageurl: 'image2.jpg'
  },
];

const mockProducts = [
  {
    id: 'prod1',
    name: 'Ceramic Plate',
    itemdescription: 'Hand-kneated clay plate',
    price: 450,
    quantity: 10,
    imageURL: 'product1.jpg'
  },
  {
    id: 'prod2',
    name: 'Modern vase',
    itemdescription: 'Inspired by Modern Art',
    price: 1200,
    quantity: 20,
    imageURL: 'product2.jpg'
  },
];

const mockShopImages = {
  'shop1': 'mocked-image-url1.jpg',
  'shop2': 'mocked-image-url2.jpg'
};

describe('Homepage Component', () => {
  const mockNavigate = jest.fn();
  const originalWindowConfirm = window.confirm;
  const mockHttpsCallable = jest.fn();

  beforeAll(() => {
    window.confirm = jest.fn(() => true); // confirmation for remove or cancel for
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Cart items functionalities tested
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
    window.confirm = originalWindowConfirm;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
    
    // Mock firebase functions
    httpsCallable.mockImplementation(() => mockHttpsCallable);
    
    // Default storage mocks
    window.localStorage.getItem.mockImplementation((key) => {
      if (key === 'userid') return 'user1';
      return null;
    });

    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'cart_items') return JSON.stringify([]);
      if (key === 'chosenshop') return null;
      if (key === 'chosenshopid') return null;
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
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    // Text in the first view on home page
    expect(await screen.findByText('Natural Craft. Rooted in Care')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Shop the collection...')).toBeInTheDocument();
    expect(screen.getByText('Artisanal Shops')).toBeInTheDocument();
  });

  it('shows loading state while fetching shops', async () => {
    mockHttpsCallable.mockImplementation(() => new Promise(() => {}));
    
    renderHomepage();
    
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('displays shops after loading', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    mockHttpsCallable.mockResolvedValueOnce({ data: mockShopImages['shop1'] });
    mockHttpsCallable.mockResolvedValueOnce({ data: mockShopImages['shop2'] });
    
    renderHomepage();
    
    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.getByText('The Nile Shop')).toBeInTheDocument();
    });
  });

  it('filters shops based on search query', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    const searchInput = await screen.findByPlaceholderText('Shop the collection...');
    fireEvent.change(searchInput, { target: { value: 'Artisan' } });
    
    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.queryByText('The Nile Shop')).not.toBeInTheDocument();
    });
  });

  it('filters shops by category', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    const categoryFilter = await screen.findByLabelText('Filter by Category:');
    fireEvent.change(categoryFilter, { target: { value: 'Leatherwork' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Artisan Pottery')).not.toBeInTheDocument();
      expect(screen.getByText('The Nile Shop')).toBeInTheDocument();
    });
  });

  it('navigates to shop view when "Enter Shop" is clicked', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    mockHttpsCallable.mockResolvedValueOnce({ data: mockShopImages['shop1'] });
    
    renderHomepage();
    
    const enterButton = await screen.findByText('Enter Shop');
    fireEvent.click(enterButton);
    
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
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
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
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
    await waitFor(() => {
      const priceFilter = screen.getByLabelText('Filter by Price:');
      fireEvent.change(priceFilter, { target: { value: 'under500' } });
    });
    
    expect(screen.getByText('Ceramic Plate')).toBeInTheDocument();
    expect(screen.queryByText('Modern vase')).not.toBeInTheDocument();
  });

  it('adds product to cart with quantity', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
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

  it('shows error when adding invalid quantity', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
    await waitFor(() => {
      const buyButtons = screen.getAllByText('Buy');
      fireEvent.click(buyButtons[0]);
    });
    
    const quantityInput = screen.getByRole('spinbutton');
    fireEvent.change(quantityInput, { target: { value: '0' } });
    
    const addButton = screen.getByText('Add To Cart');
    fireEvent.click(addButton);
    
    expect(screen.getByText('Please add a valid quantity')).toBeInTheDocument();
  });

  it('shows confirmation when going back with items in cart', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      if (key === 'cart_items') return JSON.stringify([{ id: 'prod1', quantity: 1 }]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
    const backButton = await screen.findByText('← Back');
    fireEvent.click(backButton);
    
    expect(window.confirm).toHaveBeenCalled();
  });

  it('navigates to checkout when cart icon is clicked', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    const cartIcon = await screen.findByText(/Cart\(0\)/);
    fireEvent.click(cartIcon);
    
    expect(mockNavigate).toHaveBeenCalledWith('/checkout');
  });

  it('logs out user when logout button is clicked', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    const logoutButton = await screen.findByText('Logout');
    fireEvent.click(logoutButton);
    
    expect(signOut).toHaveBeenCalledWith(auth);
    expect(window.localStorage.clear).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles error when fetching shops', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockHttpsCallable.mockRejectedValue(new Error('Failed to fetch'));
    
    renderHomepage();
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    
    consoleSpy.mockRestore();
  });

  it('displays empty state when no shops found', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [] } });
    
    renderHomepage();
    
    expect(await screen.findByText('No shops are listed yet.')).toBeInTheDocument();
  });

  it('displays empty state when no products found', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: [] });
    
    renderHomepage();
    
    expect(await screen.findByText('No artisanal products.')).toBeInTheDocument();
  });

  it('displays correct cart item count', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'cart_items') return JSON.stringify([{}, {}]); // 2 items
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    expect(await screen.findByText(/Cart\(2\)/)).toBeInTheDocument();
  });

  it('renders all navigation links', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    
    renderHomepage();
    
    expect(await screen.findByText('My Shop')).toBeInTheDocument();
    expect(screen.getByText('Track My Orders')).toBeInTheDocument();
  });

  it('shows product images in shop view', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
    await waitFor(() => {
      const productImages = screen.getAllByRole('img');
      expect(productImages.length).toBeGreaterThan(1); // At least one product image
    });
  });

  it('shows shop images in default view', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: mockShops } });
    mockHttpsCallable.mockResolvedValueOnce({ data: mockShopImages['shop1'] });
    mockHttpsCallable.mockResolvedValueOnce({ data: mockShopImages['shop2'] });
    
    renderHomepage();
    
    await waitFor(() => {
      const shopImages = screen.getAllByRole('img');
      expect(shopImages.length).toBeGreaterThan(1); // At least one shop image
    });
  });

  it('does not show current user shops', async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [...mockShops, {
      id: 'shop3',
      nameofshop: 'My Shop',
      userid: 'user1', // Same as current user
    }] }});
    
    renderHomepage();
    
    await waitFor(() => {
      expect(screen.getByText('Artisan Pottery')).toBeInTheDocument();
      expect(screen.getByText('The Nile Shop')).toBeInTheDocument();
      expect(screen.queryByText('My Shop')).not.toBeInTheDocument();
    });
  });

  it('shows loading state while fetching products', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockImplementation(() => new Promise(() => {}));
    
    renderHomepage();
    
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });

  it('shows product count when products are loaded', async () => {
    window.sessionStorage.getItem.mockImplementation((key) => {
      if (key === 'chosenshop') return JSON.stringify(mockShops[0]);
      return null;
    });
    
    mockHttpsCallable.mockResolvedValueOnce({ data: mockProducts });
    
    renderHomepage();
    
    expect(await screen.findByText(`Total number of products in shop: ${mockProducts.length}`)).toBeInTheDocument();
  });
});