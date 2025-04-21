import React from 'react';
import { Auth } from '../components/auth';
import { signInWithPopup } from 'firebase/auth';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
// Note similar imports for Auth component

//All mocks for firebase and navigation events (crucial because it is not necessarily to simulate these actions on real events)
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {}, provider: {},
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('clears cache before test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  }); // clears before each test 

  it('renders Web app name text', () => {
    render(<Auth />);
    expect(screen.getByText(/Crafts & Grain/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    // Renders the mock DOM object of this page without needing a broswer

    render(<Auth />);
    // DOM component expected to appear
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });


  // SIGN-IN POP-UP actions, which incurs navigation event as well
  it('Admin email logs in, navigates to home page', async () => {
    const mockUser = {
      uid: 'a496#',
      email: 'craftgrainlocalartisanmarketpl@gmail.com', // this is the admin email
    };

    signInWithPopup.mockResolvedValueOnce({ user: mockUser });

    render(<Auth />);
    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

    //Check if navigation event is handled
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/admin'));
    expect(localStorage.getItem('userid')).toBe(mockUser.uid);
    expect(localStorage.getItem('userEmail')).toBe(mockUser.email);
  });

  it('User email logs in, navigates to home page', async () => {
    const mockUser = {
      uid: 'u400#',
      email: 'userEmail@gmail.com',
    };

    signInWithPopup.mockResolvedValueOnce({ user: mockUser });

    render(<Auth />);

    fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/homepage'));
    expect(localStorage.getItem('userid')).toBe(mockUser.uid);
    expect(localStorage.getItem('userEmail')).toBe(mockUser.email);
  });

  it('Logs error for failed sign-in', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });
    signInWithPopup.mockRejectedValueOnce(new Error('Popup failed'));

    render(<Auth />); // after rendering DOM...

    fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));
    // Wait for the err and verify that it indeed did happen
    await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)));
    consoleSpy.mockRestore();
  });
});
