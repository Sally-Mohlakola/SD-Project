import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Addproduct } from '../components/addproduct';
import { addDoc, collection } from 'firebase/firestore';
import React from 'react';

//It is crucial to mock our firestore database since we are not going to actually add anything into it, we are simulating it
jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getFirestore: jest.fn(() => ({})), 
}));

jest.mock('../components/userinfo.js', () => ({
  useUserId: () => 'id123',
  useShopId: () => 'shop123',
}));

//Make sure that all test cache is cleared
describe('clears all AddProducts test cache', () => {
  beforeEach(() => {
  jest.clearAllMocks();
  });

  it('renders form and the submit button', () => {
    render(<Addproduct/>);

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

  it('submits form and calls the addDoc function for both collections', async () => {
    addDoc.mockResolvedValueOnce({}); // this is fro  Shops/Products
    addDoc.mockResolvedValueOnce({}); // this is for Products

    render(<Addproduct/>);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Ceremonial vase' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Inspired by ancient Mapunguwe' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    await waitFor(() => {
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'Shops', 'shop123', 'Products');
      expect(collection).toHaveBeenCalledWith(expect.anything(), 'Products');
      expect(addDoc).toHaveBeenCalledTimes(2);

      // Add the entry into a mock database !!!!

      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
        name: 'Ceremonial vase',
        itemdescription: 'Inspired by ancient Mapunguwe',
        price: 80,
        quantity: 5,
      }));

      expect(addDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      nameofitem: 'Ceremonial vase',
      description: 'Inspired by ancient Mapunguwe',
      price: 80,
      quantity: 5,
      userID: 'id123',
    }));
    });
  });

  it('handles addDoc errors for input entry to database', async () => {
    console.error = jest.fn(); //Suppress the error logs, we are not testing those now
    addDoc.mockRejectedValueOnce(new Error('Firestore error'));

    render(<Addproduct/>);

    fireEvent.change(screen.getByLabelText(/Item:/i), { target: { value: 'Clay Plate' } });
    fireEvent.change(screen.getByLabelText(/Description:/i), { target: { value: 'Elegant dining plate' } });
    fireEvent.change(screen.getByLabelText(/Price:/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Quantity/i), { target: { value: '3' } });

    fireEvent.click(screen.getByRole('button', { name: /Add Product/i }));

    await waitFor(() => {
    expect(addDoc).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled(); 
    });
  });
});
