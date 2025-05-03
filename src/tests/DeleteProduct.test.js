import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteProduct } from '../components/removeproducts'; 
import { MemoryRouter } from 'react-router-dom';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

jest.mock('firebase/firestore', () => ({
  addDoc: jest.fn(),
  collection: jest.fn(),
  getFirestore: jest.fn(() => ({})),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock localStorage to simulate the shop and product info
beforeEach(() => {
  localStorage.setItem('shopid', 'shop123');
  localStorage.setItem('Item', 'Clay Mug');
});

it('adds a product to the store and deletes it', async () => {
  const mockProduct = {
    id: 'product123',
    data: () => ({
      name: 'Clay Mug',
      description: 'A beautiful clay mug',
      price: 15,
      quantity: 10,
    }),
  };

  // Simulate the "add" operation by mocking Firestore's setDoc and collection
  setDoc.mockResolvedValueOnce({});

  // Simulate the product being in the Firestore database
  getDocs.mockResolvedValueOnce({
    empty: false,
    docs: [mockProduct],
  });

  // Render the DeleteProduct component
  render(
    <MemoryRouter>
      <DeleteProduct />
    </MemoryRouter>
  );

  // Check that the product name appears on the screen (this simulates that the product is in the store)
  expect(screen.getByText(/Clay Mug/i)).toBeInTheDocument();

  // Simulate clicking the Confirm button to delete the product
  fireEvent.click(screen.getByText(/Confirm/i));

  // Wait for the delete operation to complete and verify the Firestore delete function was called
  await waitFor(() => {
    expect(deleteDoc).toHaveBeenCalledWith(
      doc(
        expect.anything(),
        'Shops',
        'shop123',
        'products',
        'product123'
      )
    );
    // Check that the user is redirected to the products page after deletion
    expect(mockNavigate).toHaveBeenCalledWith('/products');
  });
});
