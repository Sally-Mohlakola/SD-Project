import { render, screen } from '@testing-library/react';
import {AdminShopHomepage} from '../components/admin'

//test if "Loading..." message appears when needed
test('shows loading message', () => {
    render(<AdminShopHomepage />);
    const loadText = screen.getByText(/Loading.../i);
    expect(loadText).toBeInTheDocument();
});



//tests if "Admin Dashboard" texts appears
test('display admin dashboard text', () => {
    render(<AdminShopHomepage />);
    const loadText = screen.getByText(/Admin Dashboard/i);
    expect(loadText).toBeInTheDocument();
});



//tests that shop name is rendered after fetching
test('renders shop name after loading',async () => {
    const mockShops = [{ nameofshop: 'Shop 1', description: 'Description 1', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3'}]; // Create mock data
    //getDocs is a Firebase function that fetches documents from a Firestore collection.
    // mockResolvedValue is a Jest method used to mock the return value of a function
    getDocs.mockResolvedValue({ docs: mockShops.map(shop => ({ data: () => shop })) });
  
    render(<AdminShopHomepage />);
  
    const shopName = await screen.findByText('Shop 1'); // findByText waits for the element asynchronously
    expect(shopName).toBeInTheDocument();
  });



//tests that the shop description is rendered after fetching
test('renders shop description after loading',async () => {
    const mockShops = [{ nameofshop: 'Shop 1', description: 'Description 1', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3'}]; // Create mock data
    getDocs.mockResolvedValue({ docs: mockShops.map(shop => ({ data: () => shop })) });
  
    render(<AdminShopHomepage />);
  
    const shopDescription = await screen.findByText('Description 1'); // findByText waits for the element asynchronously
    expect(shopDescription).toBeInTheDocument();
  });



//tests that the shop status is rendered after fetching
//tests that the shop description is rendered after fetching
test('renders shop status after loading',async () => {
    const mockShops = [{ nameofshop: 'Shop 1', description: 'Description 1', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3'}]; // Create mock data
    getDocs.mockResolvedValue({ docs: mockShops.map(shop => ({ data: () => shop })) });
  
    render(<AdminShopHomepage />);
  
    const shopsStatus = await screen.findByText('Pending'); // findByText waits for the element asynchronously
    expect(shopsStatus).toBeInTheDocument();
  });


//tests if status changes when checkbox clicked 
test('updates status on checkbox click',async () => {
    const mockShops = [{ nameofshop: 'Shop 1', description: 'Description 1', status: 'Pending', category: 'Pottery', userID: 'z5DhLRyCXFgggs6DPTnihguAuNH3' }];
    getDocs.mockResolvedValue({ docs: mockShops.map(shop => ({ data: () => shop })) });
  
    render(<AdminShopHomepage />);
    
    await screen.findByText('Shop 1');
    
    const acceptCheckbox = screen.getByLabelText(/Accept →/i);
    fireEvent.click(acceptCheckbox);
  
    expect(screen.getByText('Status: Accepted')).toBeInTheDocument();
  }); 
