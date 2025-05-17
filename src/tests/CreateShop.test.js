import React from 'react';
import { Createshop } from '../components/createshop';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDocs, addDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

// MOCK FIREBASE CONFIG
jest.mock('../config/firebase', () => ({
  db: {},
  storage: {},
  auth: {},
  provider: {},
}));

// MOCK REACT ROUTER
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// MOCK FIREBASE SDKs
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

beforeEach(() => {
  localStorage.setItem('userid', 'u123');
  window.alert = jest.fn();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

describe('Createshop component acceptance tests', () => {
  test('displays alert when at least one field is empty on submit', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });
    httpsCallable.mockReturnValue(() =>
      Promise.resolve({ data: { shops: [] } })
    );

    render(
      <MemoryRouter>
        <Createshop />
      </MemoryRouter>
    );

    const submitButton = screen.getByText(/Submit to admin/i);

    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), { target: { files: [new File([''], 'logo.png')] } });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
    });
  });

  test('should alert if shop name already exists', async () => {
    httpsCallable.mockReturnValue(() =>
      Promise.resolve({ data: { shops: [{ userid: 'another', nameofshop: 'Existing Shop' }] } })
    );

    render(
      <MemoryRouter>
        <Createshop />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Existing Shop' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'Some description' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), {
      target: { files: [new File(['dummy'], 'logo.png', { type: 'image/png' })] },
    });

    fireEvent.click(screen.getByText(/Submit to admin/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('A store with that name exists');
    });
  });

  test('sends data to Firebase and displays confirmation paragraph', async () => {
    httpsCallable.mockImplementation((_, name) => {
      if (name === 'getAllShops') {
        return () => Promise.resolve({ data: { shops: [] } });
      } else if (name === 'createShop') {
        return () => Promise.resolve({ data: { success: true } });
      }
      return () => Promise.resolve();
    });

    render(
      <MemoryRouter>
        <Createshop />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Ashopname' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });

    const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText(/Submit to admin/i));

    await waitFor(() => {
      expect(screen.getByText(/Your shop has been sent to admin/i)).toBeInTheDocument();
    });
  });
});
