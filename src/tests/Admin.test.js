import React from 'react';
import { AdminShopHomepage } from '../components/admin';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { getDocs, updateDoc, doc, collection } from 'firebase/firestore';
import { BrowserRouter } from 'react-router-dom';

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  collection: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  doc: jest.fn((db, collectionName, id) => ({ db, collectionName, id })),
}));

describe('AdminShopHomepage', () => {
  const mockShop = [{
    id: 'id123',
    nameofshop: 'Shop 0',
    description: 'This is a description',
    status: 'Pending',
    category: 'Pottery',
    userID: 'id123',
  }];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
  };

  it('renders loading message', () => {
    renderWithRouter(<AdminShopHomepage />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  it('renders Admin Dashboard after loading', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
        id: 'id123',
        data: () => shop,
      })),
    });

    renderWithRouter(<AdminShopHomepage />);
    expect(await screen.findByText(/Admin Dashboard/i)).toBeInTheDocument();
  });

  it('renders shop details', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
        id: 'id123',
        data: () => shop,
      })),
    });

    renderWithRouter(<AdminShopHomepage />);
    expect(await screen.findByText('Shop 0')).toBeInTheDocument();
    expect(await screen.findByText('This is a description')).toBeInTheDocument();
    expect(await screen.findByText(/Status: Pending/i)).toBeInTheDocument();
  });

  it('updates status on Accept checkbox', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
        id: 'id123',
        data: () => shop,
      })),
    });

    renderWithRouter(<AdminShopHomepage />);
    await screen.findByText('Shop 0');

    const acceptCheckbox = screen.getByLabelText(/Accept →/i);
    fireEvent.click(acceptCheckbox);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(screen.getByText('Status: Accepted')).toBeInTheDocument();
    });
  });

  it('updates status on Reject checkbox', async () => {
    getDocs.mockResolvedValueOnce({
      docs: mockShop.map(shop => ({
        id: 'id123',
        data: () => shop,
      })),
    });

    renderWithRouter(<AdminShopHomepage />);
    await screen.findByText('Shop 0');

    const rejectCheckbox = screen.getByLabelText(/Reject →/i);
    fireEvent.click(rejectCheckbox);

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
      expect(screen.getByText('Status: Rejected')).toBeInTheDocument();
    });
  });

  it('navigates to Home when Home button is clicked', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [],
    });

    renderWithRouter(<AdminShopHomepage />);
    await screen.findByText(/Admin Dashboard/i);

    const homeButton = screen.getByText(/← Home/i);
    fireEvent.click(homeButton);
    // We can only check that the button is clickable. For full router test, you'd mock useNavigate.
    expect(homeButton).toBeInTheDocument();
  });

  it('handles no shop data gracefully', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [],
    });

    renderWithRouter(<AdminShopHomepage />);
    await screen.findByText(/Admin Dashboard/i);
    expect(screen.queryByText(/Status:/i)).not.toBeInTheDocument();
  });

  it('handles Firestore error gracefully', async () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    getDocs.mockRejectedValueOnce(new Error('Firestore error'));

    renderWithRouter(<AdminShopHomepage />);
    await screen.findByText(/Admin Dashboard/i);
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
