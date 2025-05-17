import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminShopHomepage } from '../components/admin';
import { BrowserRouter } from 'react-router-dom';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn((db, path, id) => ({ db, path, id })),
  updateDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn((functions, name) => jest.fn(() => Promise.resolve({
    data: { shops: [] }
  })))
}));

jest.mock('../config/firebase', () => ({
  db: {},
  functions: {}
}));


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

//Encapsulates all tests within the component
describe('AdminShopHomepage Component', () => {
  const mockShops = [
    {
      id: 'shop1',
      nameofshop: 'Test Shop',
      description: 'Test description',
      status: 'Pending',
      category: 'Test Category',
      userID: 'user1'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    require('firebase/functions').httpsCallable.mockImplementation(() => 
      jest.fn(() => Promise.resolve({ data: { shops: mockShops } })));
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminShopHomepage />
      </BrowserRouter>
    );
  };

  it('renders loading message', () => {
    renderComponent();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders admin dashboard after loading', async () => {
    renderComponent();
    expect(await screen.findByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('displays shop data correctly', async () => {
    renderComponent();
    
    expect(await screen.findByText('Test Shop')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Status: Pending')).toBeInTheDocument();
  });

  it('handles status change to Accepted', async () => {
    const { updateDoc } = require('firebase/firestore');
    renderComponent();
    
    await screen.findByText('Test Shop');
    const acceptCheckbox = screen.getByLabelText('Accept →');
    fireEvent.click(acceptCheckbox);
    
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { db: {}, path: 'Shops', id: 'shop1' },
        { status: 'Accepted' }
      );
    });
  });

  it('handles status change to Rejected', async () => {
    const { updateDoc } = require('firebase/firestore');
    renderComponent();
    
    await screen.findByText('Test Shop');
    const rejectCheckbox = screen.getByLabelText('Reject →');
    fireEvent.click(rejectCheckbox);
    
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        { db: {}, path: 'Shops', id: 'shop1' },
        { status: 'Rejected' }
      );
    });
  });

  it('navigates to homepage when home button is clicked', async () => {
    renderComponent();
    
    await screen.findByText('Test Shop');
    const homeButton = screen.getByText('← Home');
    fireEvent.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });

  it('throws error if fetching shops does not happen correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    require('firebase/functions').httpsCallable.mockImplementation(() => 
      jest.fn(() => Promise.reject(new Error('Fetch error')))
    );
    
    renderComponent();
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('ERROR fetching shops:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('throws error when updating status does not happen correctly', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const {updateDoc} = require('firebase/firestore');
    updateDoc.mockRejectedValueOnce(new Error('Update error'));
    
    renderComponent();
    
    await screen.findByText('Test Shop');
    const acceptCheckbox = screen.getByLabelText('Accept →');
    fireEvent.click(acceptCheckbox);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error updating status:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  it('displays correctly when no shops are available', async () => {
    require('firebase/functions').httpsCallable.mockImplementation(() => 
      jest.fn(() => Promise.resolve({ data: { shops: [] } }))
    );
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.queryByText('Test Shop')).not.toBeInTheDocument();
    });
  });
});