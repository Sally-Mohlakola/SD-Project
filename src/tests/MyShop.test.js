import React from 'react';
import { MyShop } from '../components/myshop';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDocs } from 'firebase/firestore';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  addDoc: jest.fn(),
}));


beforeEach(() => {
  localStorage.setItem('userid', 'u123');
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

//When button is clicked this page must appear
const renderComponent = () => {
  return render(
    <MemoryRouter>
      <MyShop />
    </MemoryRouter>);
};

describe('MyShop component acceptance tests', () => {
  test('renders form for user with no shop', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [], //initialise with no shops
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/My Shop/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Name of shop/i)).toBeInTheDocument();
  });

  test('renders a awaiting message if shop is pending admin approval', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [
        {
          data: () => ({
            userid: 'u123',
            nameofshop: 'New shop',
            description: 'This is a description',
            status: 'Awaiting',
          }),
        },
      ],
    });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/The admin has not cleared your store yet!/i)).toBeInTheDocument();
    });
  });


  test('navigates to shop dashboard if shop is accepted', async () => {
    getDocs.mockResolvedValueOnce({
      docs: [{
        data: () => ({
          userid: 'u123',
          nameofshop: 'New shop',
          description: 'This is a description',
          status: 'Accepted',
        }),
      },],
    });

    renderComponent();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/shopdashboard');
    });
  });

  test('renders an acceptance message after shop form is submitted', async () => {
    getDocs.mockResolvedValueOnce({ docs: [] });

    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/My Shop/i)).toBeInTheDocument();
    });
    //Fire events simulate the actions are user will do, hence .change is for user typing...
    // Mock the user typing, not berate them... but pretend to be them

    //Name, descriotion, category, click button to submit
    fireEvent.change(screen.getByLabelText(/Name of shop/i), {
      target: { value: 'New Shop' },
    });

    fireEvent.change(screen.getByLabelText(/Shop description/i), {
      target: { value: 'This is a description' },
    });

    fireEvent.change(screen.getByLabelText(/Category:/i), {
      target: { value: 'Pottery' },
    });

    fireEvent.click(screen.getByText(/Submit to admin/i));
    await waitFor(() => {
      expect(screen.getByText(/Your shop has been sent to admin/i)).toBeInTheDocument();
    });
  });

});//end of cache statement
