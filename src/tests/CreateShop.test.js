// src/tests/CreateShop.test.js
import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { Createshop } from '../components/createshop';
import { httpsCallable } from 'firebase/functions';

// Mock Firebase modules completely
jest.mock('../config/firebase', () => ({
  db: {},
  storage: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  addDoc: jest.fn(),
  getDocs: jest.fn(),
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => async (params) => {
    if (params.nameofshop === 'error') throw new Error('Mocked Error');
    return { data: { shops: [{ userid: '123', nameofshop: 'testshop' }] } };
  }),
}));

jest.mock('react-router-dom', () => ({
  Link: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
}));

describe('Createshop component', () => {
  beforeEach(() => {
    localStorage.setItem('userid', '123');
  });

  it('renders without crashing', () => {
    render(<Createshop />);
    expect(screen.getByText('Creating my Shop')).toBeInTheDocument();
  });

  it('displays alert when fields incomplete', async () => {
    window.alert = jest.fn();
    render(<Createshop />);
    fireEvent.click(screen.getByText('Submit to admin'));
    expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
  });
test('checks for duplicate shop name and shows alert', async () => {
  window.alert = jest.fn();

  // Mock httpsCallable to return a shop with name 'testshop'
  httpsCallable.mockImplementation(() => {
    return async () => ({
      data: {
        shops: [
          { userid: 'someUserId', nameofshop: 'testshop' }, // Duplicate shop here!
        ],
      },
    });
  });

  render(<Createshop />);

  // Wait for the shoplist to be set (because of async useEffect)
  await waitFor(() => {
    // We can check for something in the DOM or just wait for any state change
    expect(screen.getByLabelText('Name of shop')).toBeInTheDocument();
  });

  // Fill all required fields:
  fireEvent.change(screen.getByLabelText('Name of shop'), { target: { value: 'testshop' } });
  fireEvent.change(screen.getByLabelText('Category:'), { target: { value: 'Pottery' } });
  fireEvent.change(screen.getByLabelText('Shop description'), { target: { value: 'Test description' } });

  // File input dummy file
  const file = new File(['dummy content'], 'logo.png', { type: 'image/png' });
  const inputFile = screen.getByLabelText('Add logo/image:');
  Object.defineProperty(inputFile, 'files', { value: [file] });
  fireEvent.change(inputFile);

  fireEvent.click(screen.getByText('Submit to admin'));

  expect(window.alert).toHaveBeenCalledWith('A store with that name exists');
});
  it('submits successfully when all fields are filled and no duplicate name', async () => {
    window.alert = jest.fn();
    render(<Createshop />);
    fireEvent.change(screen.getByLabelText('Name of shop'), { target: { value: 'uniqueShop' } });
    fireEvent.change(screen.getByLabelText('Category:'), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText('Shop description'), { target: { value: 'Description' } });

    // Mock file input
    const file = new File(['dummy content'], 'shop.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText('Add logo/image:');
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Submit to admin'));

    await waitFor(() => {
      expect(screen.getByText('Your shop has been sent to admin')).toBeInTheDocument();
    });
  });
});
