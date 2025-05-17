
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteProduct } from '../components/removeproducts';
import React from 'react';

// Mock Firebase services
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})), 
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn((db, path) => ({path, withConverter: jest.fn()})),
  doc: jest.fn((db, path, id) => ({ path, id })),
  where: jest.fn((field, op, value) => ({ field, op, value })),
  query: jest.fn((ref, ...queries) => ({ ref, queries })),
  getDocs: jest.fn(() => Promise.resolve({ 
    empty: false, docs: [{ id: 'doc1', data: () => ({ name: 'Test Item' })}] })),
  deleteDoc: jest.fn(() => Promise.resolve()),}));

jest.mock('firebase/storage', () => ({
  getStorage: jest.fn(() => ({})), 
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
}));

// Mock react-router
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock userinfo hook
jest.mock('../components/userinfo.js', () => ({
  useShopId: () => 'mockShopId',
}));

describe('DeleteProduct Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders confirmation UI with the correct item name', () => {
    localStorage.setItem('Item', 'Test Item');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    
    expect(screen.getByText(/Do you want to remove/i)).toHaveTextContent(
      'Do you want to remove "Test Item"'
    );
    expect(screen.getByRole('button', { name: /Back/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirm/i })).toBeInTheDocument();
  });

  it('navigates back when Back button is clicked', () => {
    localStorage.setItem('Item', 'Test Item');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    
    fireEvent.click(screen.getByRole('button', { name: /Back/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
  });

  it('deletes product and navigates on Confirm click', async () => {
    const { getDocs, doc, deleteDoc } = require('firebase/firestore');

    localStorage.setItem('Item', 'Test Item');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);

    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(doc).toHaveBeenCalledWith(
        expect.anything(),
        'Shops','shop123', 'Products', 'doc1');
      expect(deleteDoc).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('handles empty query snapshot', async () => {
    const { getDocs } = require('firebase/firestore');
    getDocs.mockResolvedValueOnce({ empty: true });

    localStorage.setItem('Item', 'Test Item');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);

    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('handles delete error', async () => {
    const { getDocs, deleteDoc } = require('firebase/firestore');
    deleteDoc.mockRejectedValueOnce(new Error('Delete failed'));

    localStorage.setItem('Item', 'Test Item');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);

    fireEvent.click(screen.getByRole('button', { name: /Confirm/i }));

    await waitFor(() => {
      expect(getDocs).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/displayproducts');
    });
  });

  it('shows empty item name when Item is not in localStorage', () => {
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    expect(screen.getByText(/Do you want to remove ""/i)).toBeInTheDocument();
  });

  it('polls for Item in localStorage and updates when found', () => {
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    
    // Initial render shows empty item name
    expect(screen.getByText(/Do you want to remove ""/i)).toBeInTheDocument();
    
    // Advance timers and add Item to localStorage
    jest.advanceTimersByTime(5000);
    localStorage.setItem('Item', 'New Item');
    jest.advanceTimersByTime(5000);
    
    // Verify component updates with new item name
    expect(screen.getByText(/Do you want to remove "New Item"/i)).toBeInTheDocument();
  });

  it('cleans up interval on unmount', () => {
    localStorage.setItem('shopid', 'shop123');
    const { unmount } = render(<DeleteProduct />);
    const clearIntervalSpy = jest.spyOn(window, 'clearInterval');
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

  it('logs messages while waiting for Item', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    
    jest.advanceTimersByTime(5000);
    expect(consoleSpy).toHaveBeenCalledWith('still waiting for item');
    
    consoleSpy.mockRestore();
  });

  it('stops polling when Item is found', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    localStorage.setItem('shopid', 'shop123');
    render(<DeleteProduct />);
    
    // First poll
    jest.advanceTimersByTime(5000);
    expect(consoleSpy).toHaveBeenCalledWith('still waiting for item');
    
    // Add Item and advance timers
    localStorage.setItem('Item', 'Found Item');
    jest.advanceTimersByTime(5000);
    expect(consoleSpy).toHaveBeenCalledWith('Item captured');
    
    // Verify no more polling
    consoleSpy.mockClear();
    jest.advanceTimersByTime(5000);
    expect(consoleSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();

  });


describe('DeleteProduct Component', () => {
    // ... (keep all your existing test cases)

    it('logs messages while waiting for Item', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        localStorage.setItem('shopid', 'shop123');
        render(<DeleteProduct />);
        
        jest.advanceTimersByTime(5000);
        expect(consoleSpy).toHaveBeenCalledWith('still waiting for item');
        
        consoleSpy.mockRestore();
    });

    it('stops polling when Item is found', () => {
        const consoleSpy = jest.spyOn(console, 'log');
        localStorage.setItem('shopid', 'shop123');
        const { rerender } = render(<DeleteProduct />);
        
        // First poll
        jest.advanceTimersByTime(5000);
        expect(consoleSpy).toHaveBeenCalledWith('still waiting for item');
        
        // Add Item and rerender
        localStorage.setItem('Item', 'Found Item');
        rerender(<DeleteProduct />);
        jest.advanceTimersByTime(5000);
        expect(consoleSpy).toHaveBeenCalledWith('Item captured');
        
        // Verify no more polling
        consoleSpy.mockClear();
        jest.advanceTimersByTime(5000);
        expect(consoleSpy).not.toHaveBeenCalled();
        
        consoleSpy.mockRestore();
    });
});
});