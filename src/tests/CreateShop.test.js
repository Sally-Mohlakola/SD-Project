// src/tests/CreateShop.test.js
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { Createshop } from '../components/createshop';
import { httpsCallable } from 'firebase/functions';
import { useNavigate } from 'react-router-dom';

// Mock all necessary modules
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) {
      return store[key] || null;
    },
    setItem: function(key, value) {
      store[key] = value.toString();
    },
    clear: function() {
      store = {};
    }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Createshop component', () => {
  const mockNavigate = jest.fn();
  const mockHttpsCallable = jest.fn();

  beforeEach(() => {
    localStorage.setItem('userid', '123');
    useNavigate.mockReturnValue(mockNavigate);
    httpsCallable.mockReturnValue(mockHttpsCallable);
    window.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders without crashing', () => {
    render(<Createshop />);
    expect(screen.getByText('Creating my Shop')).toBeInTheDocument();
  });

  it('fetches shop list on mount', async () => {
    mockHttpsCallable.mockResolvedValueOnce({
      data: { shops: [{ userid: '123', nameofshop: 'testshop' }] }
    });

    render(<Createshop />);
    
    await waitFor(() => {
      expect(mockHttpsCallable).toHaveBeenCalled();
    });
  });

  it('shows alert when submitting with incomplete fields', () => {
    render(<Createshop />);
    fireEvent.click(screen.getByText('Submit to admin'));
    expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting');
  });

  it('detects duplicate shop names', async () => {
    mockHttpsCallable
      .mockResolvedValueOnce({ // First call for getAllShops
        data: { shops: [{ userid: '123', nameofshop: 'existingShop' }] }
      })
      .mockResolvedValueOnce({}); // Second call for createShop

    render(<Createshop />);
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Name of shop'), { 
        target: { value: 'existingShop' } 
      });
      fireEvent.change(screen.getByLabelText('Category:'), { 
        target: { value: 'Pottery' } 
      });
      fireEvent.change(screen.getByLabelText('Shop description'), { 
        target: { value: 'Test description' } 
      });
      
      // Mock file upload
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
      
      fireEvent.click(screen.getByText('Submit to admin'));
      expect(window.alert).toHaveBeenCalledWith('A store with that name exists');
    });
  });

  it('successfully submits when all fields are valid', async () => {
    mockHttpsCallable
      .mockResolvedValueOnce({ // First call for getAllShops
        data: { shops: [] }
      })
      .mockResolvedValueOnce({ // Second call for createShop
        data: { success: true }
      });

    render(<Createshop />);
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Name of shop'), { 
        target: { value: 'newShop' } 
      });
      fireEvent.change(screen.getByLabelText('Category:'), { 
        target: { value: 'Pottery' } 
      });
      fireEvent.change(screen.getByLabelText('Shop description'), { 
        target: { value: 'Test description' } 
      });
      
      // Mock file upload
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
      
      fireEvent.click(screen.getByText('Submit to admin'));
    });

    await waitFor(() => {
      expect(screen.getByText('Your shop has been sent to admin')).toBeInTheDocument();
    });
  });

  it('handles image upload and preview', async () => {
    render(<Createshop />);
    
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('file-input');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText('Change')).toBeInTheDocument();
      expect(screen.getByText('Remove')).toBeInTheDocument();
    });
  });

  it('handles image removal', async () => {
    render(<Createshop />);
    
    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('file-input');
    Object.defineProperty(fileInput, 'files', { value: [file] });
    fireEvent.change(fileInput);
    
    fireEvent.click(screen.getByText('Remove'));
    
    await waitFor(() => {
      expect(screen.queryByText('Change')).not.toBeInTheDocument();
      expect(screen.getByText('Upload Shop Image')).toBeInTheDocument();
    });
  });

  it('navigates to home when cancel is clicked', () => {
    render(<Createshop />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });

  it('navigates to home after successful submission', async () => {
    mockHttpsCallable
      .mockResolvedValueOnce({ // First call for getAllShops
        data: { shops: [] }
      })
      .mockResolvedValueOnce({ // Second call for createShop
        data: { success: true }
      });

    render(<Createshop />);
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Name of shop'), { 
        target: { value: 'newShop' } 
      });
      fireEvent.change(screen.getByLabelText('Category:'), { 
        target: { value: 'Pottery' } 
      });
      fireEvent.change(screen.getByLabelText('Shop description'), { 
        target: { value: 'Test description' } 
      });
      
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
      
      fireEvent.click(screen.getByText('Submit to admin'));
    });

    fireEvent.click(screen.getByText('Home'));
    expect(mockNavigate).toHaveBeenCalledWith('/homepage');
  });

  it('handles API errors gracefully', async () => {
    mockHttpsCallable
      .mockResolvedValueOnce({ // First call for getAllShops
        data: { shops: [] }
      })
      .mockRejectedValueOnce(new Error('API Error'));

    render(<Createshop />);
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Name of shop'), { 
        target: { value: 'newShop' } 
      });
      fireEvent.change(screen.getByLabelText('Category:'), { 
        target: { value: 'Pottery' } 
      });
      fireEvent.change(screen.getByLabelText('Shop description'), { 
        target: { value: 'Test description' } 
      });
      
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
      
      fireEvent.click(screen.getByText('Submit to admin'));
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error submitting shop. Please try again.');
    });
  });

  it('shows loading state during submission', async () => {
    mockHttpsCallable
      .mockResolvedValueOnce({ // First call for getAllShops
        data: { shops: [] }
      })
      .mockImplementationOnce(() => new Promise(resolve => {
        setTimeout(() => resolve({ data: { success: true } }), 1000);
      }));

    render(<Createshop />);
    
    await waitFor(() => {
      fireEvent.change(screen.getByLabelText('Name of shop'), { 
        target: { value: 'newShop' } 
      });
      fireEvent.change(screen.getByLabelText('Category:'), { 
        target: { value: 'Pottery' } 
      });
      fireEvent.change(screen.getByLabelText('Shop description'), { 
        target: { value: 'Test description' } 
      });
      
      const file = new File(['dummy'], 'test.png', { type: 'image/png' });
      const fileInput = screen.getByTestId('file-input');
      Object.defineProperty(fileInput, 'files', { value: [file] });
      fireEvent.change(fileInput);
      
      fireEvent.click(screen.getByText('Submit to admin'));
    });

    expect(screen.getByText('Submitting your shop...')).toBeInTheDocument();
  });
});