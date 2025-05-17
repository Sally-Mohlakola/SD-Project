import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {Addproduct} from '../components/addproducts';
import {addDoc, collection} from 'firebase/firestore';
import {uploadBytes} from 'firebase/storage';
import React from 'react';


jest.mock('../config/firebase.js', () => ({
  db: {}, storage: {},}));

jest.mock('firebase/firestore', () => {
return {
    addDoc: jest.fn(),
    collection: jest.fn(),
    getFirestore: jest.fn(() => ({})),
  };
});

// For image uploads and fetches
jest.mock('firebase/storage', () => {
  return {
    ref: jest.fn(),
    uploadBytes: jest.fn(),
    getDownloadURL: jest.fn(() => Promise.resolve('https://mockwebsite.com/mockimage.jpg')),
    getStorage: jest.fn(() => ({})),
  };
});

jest.mock('../components/userinfo.js', () => ({
  useUserId: () => 'id123', useShopId: () => 'shop123',
}));


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({useNavigate: () => mockNavigate,}));

// Clear all mock storages so that each test runs independantly
beforeEach(() => {
  localStorage.setItem('shopid', 'shop123');
  jest.clearAllMocks();
});



describe('AddProduct Component', () => {
  it('renders the add-product form and submit button', () => {
    render(<Addproduct/>);

    expect(screen.getByLabelText(/Item:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Product/i })).toBeInTheDocument();
  });

  it('updates input values correctly', () => {
    render(<Addproduct />);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Scandinavian pottery' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Terracota vase' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '45' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '1000' } });

    expect(screen.getByLabelText(/Item:/i).value).toBe('Scandinavian Mug');
    expect(screen.getByLabelText(/Description:/i).value).toBe('Clay Terracota');
    expect(screen.getByLabelText(/Price:/i).value).toBe('45');
    expect(screen.getByLabelText(/Quantity/i).value).toBe('1000');
  });

  it('submits the add-product form and calls addDoc with correct data', async () => {
    addDoc.mockResolvedValueOnce({});
    uploadBytes.mockResolvedValueOnce({});

    render(<Addproduct/>);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Ceremonial Vase' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Inspired by Mapungubwe' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '2' } });

    const file = new File(['dummy content'], 'image.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Upload image of item below:/i), { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'Shops', 'shop123', 'Products');
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Ceremonial Vase',
        itemdescription: 'Inspired by Mapungubwe',
        price: 100,
        quantity: 2,
        sold: 0,
        imageURL: 'https://fakeurl.com/fakeimage.jpg',
      }));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
  });

// For if addDoc fails the error is recorded
  it('handles addDoc failure gracefully', async () => {
  addDoc.mockRejectedValueOnce(new Error('Firestore error'));
  uploadBytes.mockResolvedValueOnce({});

  render(<Addproduct/>);

  fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Clay Plate' } });
  fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Elegant Plate' } });
  fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '120' } });
  fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '4' } });

//Renders the image corresponding to the item/ product
  const imageFromFile = new File(['dummy content'], 'plate.png', { type: 'image/png' });
  fireEvent.change(screen.getByLabelText(/Upload image of item below:/i), { target: { files: [imageFromFile] } });

  fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

  await waitFor(() => {
    expect(addDoc).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

});
