import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Addproduct } from '../components/addproducts';
import React from 'react';

// Fully mock the entire firebase/firestore module
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getFirestore: jest.fn(() => ({})),
}));

// Fully mock the firebase/storage module
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(() => Promise.resolve('https://fakeurl.com/fakeimage.jpg')),
  getStorage: jest.fn(() => ({})),
}));

// Mock userinfo hook
jest.mock('../components/userinfo.js', () => ({
  useUserId: () => 'id123',
  useShopId: () => 'shop123',
}));

// Mock react-router
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('clears all AddProducts test cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form and the submit button', () => {
    render(<Addproduct />);

    expect(screen.getByLabelText(/Item:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Price:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Quantity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Product/i })).toBeInTheDocument();
  });

  it('handles input changes', () => {
    render(<Addproduct />);

    const nameInput = screen.getByLabelText(/Item:/i);
    fireEvent.change(nameInput, { target: { value: 'Pottery Mug' } });
    expect(nameInput.value).toBe('Pottery Mug');

    const descInput = screen.getByLabelText(/Description:/i);
    fireEvent.change(descInput, { target: { value: 'Handmade clay mug' } });
    expect(descInput.value).toBe('Handmade clay mug');

    const priceInput = screen.getByLabelText(/Price:/i);
    fireEvent.change(priceInput, { target: { value: '50' } });
    expect(priceInput.value).toBe('50');

    const quantityInput = screen.getByLabelText(/Quantity/i);
    fireEvent.change(quantityInput, { target: { value: '10' } });
    expect(quantityInput.value).toBe('10');
  });

  it('submits form and calls addDoc', async () => {
    const { addDoc, collection } = require('firebase/firestore');
    const { uploadBytes } = require('firebase/storage');

    addDoc.mockResolvedValueOnce({});
    uploadBytes.mockResolvedValueOnce({});

    render(<Addproduct />);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Ceremonial vase' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Inspired by ancient Mapunguwe' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } });

    // Simulate selecting a file
    const file = new File(['dummy content'], 'example.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload image of item below:/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'Shops', 'shop123', 'Products');
      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Ceremonial vase',
        itemdescription: 'Inspired by ancient Mapunguwe',
        price: 80,
        quantity: 5,
        sold: 0,
        imageURL: 'https://fakeurl.com/fakeimage.jpg',
      }));
    });
  });

  it('handles addDoc errors', async () => {
    const { addDoc } = require('firebase/firestore');
    const { uploadBytes } = require('firebase/storage');

    console.error = jest.fn(); // suppress error logs
    addDoc.mockRejectedValueOnce(new Error('Firestore error'));
    uploadBytes.mockResolvedValueOnce({});

    render(<Addproduct />);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Clay Plate' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Elegant dining plate' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '3' } });

    const file = new File(['dummy content'], 'plate.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload image of item below:/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
