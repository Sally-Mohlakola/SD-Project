import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Displayproducts } from '../components/displayproducts';
import { getDocs, updateDoc, collection, doc } from 'firebase/firestore';

//mock the firestore database
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

//test if "My Products appear on page"
it('renders My Products test', async () => {
    render(<Displayproducts/>);
    expect(await screen.findByText(/My Products/i)).toBeInTheDocument();
});


//mock an entry into a mock database
const mockProduct = [{
    id: 'id123',
    imageURL: 'https://firebasestorage.googleapis.com/v0/b/sd-database-19b80.firebasestorage.app/o/products%2Fd6695ead-f478-4a29-9897-baae075a633b-Screenshot%202025-05-01%20104926.png?alt=media&token=77cfa528-906f-4bd6-b62f-910dae1061e1',
    itemdescription: 'this is a product',
    name: 'one',
    price: 45,
    quantity: 1,
}];

//test item description appears
it('renders item description', async () => {
    getDocs.mockResolvedValueOnce({
        docs: mockProduct.map(product => ({
            id: 'id123',
            data: () => product,
        }))
    });

    render(<Displayproducts/>);
    const productDesc = await screen.findByText('Description:this is a product');
    expect(productDesc).toBeInTheDocument();
});

//test item name appears
it('renders item name', async () => {
    getDocs.mockResolvedValueOnce({
        docs: mockProduct.map(product => ({
            id: 'id123',
            data: () => product,
        }))
    });

    render(<Displayproducts/>);
    const productName = await screen.findByText('Name: one');
    expect(productName).toBeInTheDocument();
});


//test price appears
it('renders item price', async () => {
    getDocs.mockResolvedValueOnce({
        docs: mockProduct.map(product => ({
            id: 'id123',
            data: () => product,
        }))
    });

    render(<Displayproducts/>);
    const price = await screen.findByText('Price:45');
    expect(price).toBeInTheDocument();
});

//test quantity appears
it('renders item quantity', async () => {
    getDocs.mockResolvedValueOnce({
        docs: mockProduct.map(product => ({
            id: 'id123',
            data: () => product,
        }))
    });

    render(<Displayproducts/>);
    const quantity = await screen.findByText('Quantity:1');
    expect(quantity).toBeInTheDocument();
});



});//end clear cache here
