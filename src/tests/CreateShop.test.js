// src/tests/Createshop.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Createshop } from '../components/createshop';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Mocks
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

// Mock FileReader
class MockFileReader {
  readAsDataURL = jest.fn(() => {
    this.onload({ target: { result: 'data:image/png;base64,mockbase64' } });
  });
  onload = null;
  onerror = null;
}

global.FileReader = MockFileReader;

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-preview-url');

describe('Createshop', () => {
  const navigate = jest.fn();
  const mockGetAllShops = jest.fn();
  const mockCreateShop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useNavigate.mockReturnValue(navigate);

    getFunctions.mockReturnValue('mockFunctions');

    httpsCallable.mockImplementation((functions, name) => {
      if (name === 'getAllShops') {
        return mockGetAllShops;
      }
      if (name === 'createShop') {
        return mockCreateShop;
      }
    });
  });

  test('renders all inputs and loads shops on mount', async () => {
    mockGetAllShops.mockResolvedValueOnce({
      data: { shops: [{ nameofshop: 'ShopA' }] },
    });

    render(<Createshop />);

    await waitFor(() => {
      expect(mockGetAllShops).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByLabelText(/Name of shop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Shop description/i)).toBeInTheDocument();
    // We added aria-label "Upload Shop Image" to file input for test
    expect(screen.getByLabelText(/Upload Shop Image/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit to admin/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  test('shows alert and prevents submission if fields are incomplete', async () => {
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });
    window.alert = jest.fn();

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Submit to admin/i }));

    expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting');
  });

  test('checks for duplicate shop name and alerts if exists', async () => {
    mockGetAllShops.mockResolvedValueOnce({
      data: { shops: [{ nameofshop: 'ShopA' }] },
    });
    window.alert = jest.fn();

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Name of shop/i), {
      target: { value: 'ShopA' },
    });

    // Fill other fields so submit check passes
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'Category1' },
    });
    fireEvent.change(screen.getByLabelText(/Shop description/i), {
      target: { value: 'Desc' },
    });

    // Upload file
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload Shop Image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Submit to admin/i }));

    expect(window.alert).toHaveBeenCalledWith('A store with that name exists');
  });

  test('handles image upload and preview display', async () => {
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });

    // Just get file input directly via aria-label
    const fileInput = screen.getByLabelText(/Upload Shop Image/i);

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(await screen.findByAltText(/Preview/i)).toBeInTheDocument();
  });

  test('successfully submits shop data and shows confirmation', async () => {
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });
    mockCreateShop.mockResolvedValueOnce(true);

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Name of shop/i), {
      target: { value: 'NewShop' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'Pottery' },
    });
    fireEvent.change(screen.getByLabelText(/Shop description/i), {
      target: { value: 'Nice shop' },
    });

    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload Shop Image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Submit to admin/i }));

    await waitFor(() => {
      expect(mockCreateShop).toHaveBeenCalledWith({
        userid: expect.anything(),
        nameofshop: 'NewShop',
        description: 'Nice shop',
        status: 'Awaiting',
        category: 'Pottery',
        image: 'mockbase64',
        ext: 'png',
      });
    });

    expect(screen.getByText(/Your shop has been sent to admin/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Home/i }));
    expect(navigate).toHaveBeenCalledWith('/homepage');
  });

  test('handles submission error gracefully', async () => {
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });
    mockCreateShop.mockRejectedValueOnce(new Error('Failed'));

    window.alert = jest.fn();
    console.error = jest.fn();

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText(/Name of shop/i), {
      target: { value: 'NewShop' },
    });
    fireEvent.change(screen.getByLabelText(/Category/i), {
      target: { value: 'Pottery' },
    });
    fireEvent.change(screen.getByLabelText(/Shop description/i), {
      target: { value: 'Nice shop' },
    });

    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/Upload Shop Image/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: /Submit to admin/i }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error submitting shop. Please try again.');
      expect(console.error).toHaveBeenCalled();
    });
  });

  test('cancel button navigates back home', async () => {
    mockGetAllShops.mockResolvedValueOnce({ data: { shops: [] } });

    render(<Createshop />);

    await waitFor(() => expect(mockGetAllShops).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(navigate).toHaveBeenCalledWith('/homepage');
  });
});
