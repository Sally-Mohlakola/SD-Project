import React from 'react';
import { AdminShopHomepage } from '../components/admin';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getDocs, updateDoc, doc } from 'firebase/firestore';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(), // ← This is the fix
  collection: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn((db, collectionName, id) => ({ db, collectionName, id })),
}));


describe('clears cache before test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  }); // clears before each test 


  it('renders loading message', async () => {
    render(<AdminShopHomepage/>);
      expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  
  });

  it('renders Admin Dashboard text', async () => {
  render(<AdminShopHomepage />);
  expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
  });
/************/
//Mock an entry into a mock database
  const mockShop = [{
    id: 'id123',
    nameofshop: 'Shop 0',
    description: 'This is a description',
    status: 'Pending',
    category: 'Pottery',
    userID: 'id123',
  }];

  it('renders shop name', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
      id: 'id123',
      data: () => shop,
      }))
    });

    render(<AdminShopHomepage />);
    const shopName = await screen.findByText('Shop 0');
    expect(shopName).toBeInTheDocument();
  });



  it('renders shop description', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
      id: 'id123',
      data: () => shop,
    }))
    });
    render(<AdminShopHomepage />);
    const shopDesc = await screen.findByText('This is a description');
    expect(shopDesc).toBeInTheDocument();
});

it('renders shop status', async () => {
  getDocs.mockResolvedValueOnce({
    docs: mockShop.map(shop => ({
    id: 'id123',
    data: () => shop,
    }))
  });
  render(<AdminShopHomepage />);
  const shopStatus = await screen.findByText(/Status: Pending/i);
  expect(shopStatus).toBeInTheDocument();
});

// Test if the checkbox works properly (error on jest.fn())
it('updates status on Accept checkbox', async () => {
  getDocs.mockResolvedValueOnce({
    docs: mockShop.map(shop => ({
    id:'id123',
    data: () => shop,
  }))
  });

  render(<AdminShopHomepage />);
  await screen.findByText('Shop 0');

  const checkbox = screen.getByLabelText(/Accept →/i);
  fireEvent.click(checkbox);

  await waitFor(() =>
    {
    expect(updateDoc).toHaveBeenCalled();
    expect(screen.getByText('Status: Accepted')).toBeInTheDocument();
  });
});


//tests that shop name is rendered after fetching
test('renders shop name after loading', async () => {
  const mockShop = [{ nameofshop: 'Shop 0', description: 'This is a description', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3' }]; // Create mock data
  //getDocs is a Firebase function, fetches from Firestore collection.
  // mockResolvedValue is a Jest method used to mock the return value of a function
  getDocs.mockResolvedValue({ docs: mockShop.map(shop => ({ data: () => shop })) });

  render(<AdminShopHomepage />);

  const shopName = await screen.findByText('Shop 0'); // findByText waits for the element asynchronously
  expect(shopName).toBeInTheDocument();
});





});//end clear cache here
/*





 













//tests if status changes when checkbox clicked 
test('updates status on checkbox click', async () => {
  const mockShops = [{ nameofshop: 'Shop 1', description: 'Description 1', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3' }];
  getDocs.mockResolvedValue({ docs: mockShops.map(shop => ({ data: () => shop })) });

  render(<AdminShopHomepage />);

  await screen.findByText('Shop 1');

  const acceptCheckbox = screen.getByLabelText(/Accept →/i);
  fireEvent.click(acceptCheckbox);

  expect(screen.getByText('Status: Accepted')).toBeInTheDocument();
}); 
*/
