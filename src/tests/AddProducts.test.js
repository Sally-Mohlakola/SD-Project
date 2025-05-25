import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Addproduct } from '../components/addproducts.js';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../config/firebase.js';
import { collection, addDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

describe('Deliberately Failing Test', () => {
  it('should fail because 1 + 1 does not equal 3', () => {
    expect(1 + 1).toBe(3); // This will fail
  })})

// Mock all external dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../config/firebase.js', () => ({
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

describe('Addproduct Component', () => {
  const mockNavigate = jest.fn();
  const mockShopId = 'test-shop-id';

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    localStorage.setItem('shopid', mockShopId);
    
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock successful responses
    uploadBytes.mockResolvedValue();
    getDownloadURL.mockResolvedValue('http://example.com/image.jpg');
    addDoc.mockResolvedValue();
    uuidv4.mockReturnValue('unique-id');
  });

  it('renders all form elements correctly', () => {
    render(<Addproduct />);
    
    expect(screen.getByText('Add products')).toBeInTheDocument();
    expect(screen.getByLabelText('Item:')).toBeInTheDocument();
    expect(screen.getByLabelText('Description:')).toBeInTheDocument();
    expect(screen.getByLabelText('Price:')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Upload image of item below:')).toBeInTheDocument();
    expect(screen.getByText('Add Product')).toBeInTheDocument();
    expect(screen.getByText('← Back')).toBeInTheDocument();
  });

  it('updates state when form inputs change', () => {
    render(<Addproduct />);
    
    const itemInput = screen.getByLabelText('Item:');
    const priceInput = screen.getByLabelText('Price:');
    const quantityInput = screen.getByLabelText('Quantity');
    const descriptionInput = screen.getByLabelText('Description:');
    
    fireEvent.change(itemInput, { target: { value: 'Test Item' } });
    fireEvent.change(priceInput, { target: { value: '100' } });
    fireEvent.change(quantityInput, { target: { value: '5' } });
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    
    expect(itemInput.value).toBe('Test Item');
    expect(priceInput.value).toBe('100');
    expect(quantityInput.value).toBe('5');
    expect(descriptionInput.value).toBe('Test description');
  });

  it('handles image upload', () => {
    render(<Addproduct />);
    
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload image of item below:/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(fileInput.files[0]).toBe(file);
  });

  it('shows alert when required fields are missing', async () => {
    window.alert = jest.fn();
    render(<Addproduct />);
    
    const submitButton = screen.getByText('Add Product');
    fireEvent.click(submitButton);
    
    expect(window.alert).toHaveBeenCalledWith('Please fill in the required fields');
  });

  it('submits form data successfully', async () => {
    render(<Addproduct />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Item:'), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText('Price:'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'Test description' } });
    
    // Mock file upload
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Upload image of item below:/i), { 
      target: { files: [file] } 
    });
    
    // Mock alert
    window.alert = jest.fn();
    
    // Submit the form
    fireEvent.click(screen.getByText('Add Product'));
    
    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      
      expect(addDoc).toHaveBeenCalledWith(collection(db, "Shops", mockShopId, "Products"), {
        name: 'Test Item',
        itemdescription: 'Test description',
        price: 100,
        quantity: 5,
        sold: 0,
        imageURL: 'http://example.com/image.jpg'
      });
      
      expect(window.alert).toHaveBeenCalledWith('Your Product has been added successfully!');
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('handles form submission errors', async () => {
    // Mock a failed upload
    uploadBytes.mockRejectedValue(new Error('Upload failed'));
    
    render(<Addproduct />);
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Item:'), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText('Price:'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Quantity'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'Test description' } });
    
    // Mock file upload
    const file = new File(['test'], 'test.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Upload image of item below:/i), { 
      target: { files: [file] } 
    });
    
    // Submit the form
    fireEvent.click(screen.getByText('Add Product'));
    
    await waitFor(() => {
      expect(uploadBytes).toHaveBeenCalled();
      expect(addDoc).not.toHaveBeenCalled();
    });
  });

  it('navigates back when back button is clicked', () => {
    render(<Addproduct />);
    
    const backButton = screen.getByText('← Back');
    fireEvent.click(backButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
  });
});