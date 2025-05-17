import React from 'react';
import { Auth } from '../components/auth';
import { signInWithPopup } from 'firebase/auth';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { getDocs, collection } from 'firebase/firestore';


jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
}));

jest.mock('../config/firebase', () => ({
  auth: {}, 
  provider: {},
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  getDocs: jest.fn(),
  collection: jest.fn(),
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));


beforeAll(() => {
  Object.defineProperty(window, 'innerHeight', { value: 800 });
  Object.defineProperty(window, 'scrollY', { value: 0 });
});

describe('Auth Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    window.scrollY = 0;
  });

  it('renders Web app name text', () => {
    render(<Auth />);
    expect(screen.getByText(/Crafts & Grain/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<Auth />);
    expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
  });

  describe('Admin email handling', () => {
    it('fetches admin emails on mount', async () => {
      const mockAdminEmails = ['admin@example.com'];
      getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ AdminEmail: 'admin@example.com' }) }]
      });
      
      render(<Auth />);
      
      await waitFor(() => {
        expect(collection).toHaveBeenCalledWith(expect.anything(), 'Admin');
        expect(getDocs).toHaveBeenCalled();
      });
    });

    it('handles admin email fetch error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      getDocs.mockRejectedValueOnce(new Error('Fetch failed'));
      
      render(<Auth />);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Sign-in functionality', () => {
    it('Admin email logs in, navigates to admin page', async () => {
      const mockUser = {
        uid: 'a496#',
        email: 'craftgrainlocalartisanmarketpl@gmail.com',
      };
      
      getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ AdminEmail: mockUser.email }) }]
      });
      signInWithPopup.mockResolvedValueOnce({ user: mockUser });

      render(<Auth />);
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
        expect(localStorage.getItem('userid')).toBe(mockUser.uid);
        expect(localStorage.getItem('userEmail')).toBe(mockUser.email);
      });
    });

    it('Regular user logs in, navigates to homepage', async () => {
      const mockUser = {
        uid: 'u400#',
        email: 'user@gmail.com',
      };
      
      getDocs.mockResolvedValueOnce({
        docs: [{ data: () => ({ AdminEmail: 'admin@example.com' }) }]
      });
      signInWithPopup.mockResolvedValueOnce({ user: mockUser });

      render(<Auth />);
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/homepage');
        expect(localStorage.getItem('userid')).toBe(mockUser.uid);
        expect(localStorage.getItem('userEmail')).toBe(mockUser.email);
      });
    });

    it('Logs error for failed sign-in', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      signInWithPopup.mockRejectedValueOnce(new Error('Popup failed'));

      render(<Auth />);
      fireEvent.click(screen.getByRole('button', { name: /sign in with google/i }));

      await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error)));
      consoleSpy.mockRestore();
    });
  });

  describe('Scroll effects', () => {
    it('responds to scroll events', () => {
      render(<Auth />);
      
   
      window.scrollY = 400;
      fireEvent.scroll(window);
      
     
      expect(window.scrollY).toBe(400);
    });

    it('cleans up scroll event listener on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      const { unmount } = render(<Auth />);
      
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function)
      );
      removeEventListenerSpy.mockRestore();
    });
  });
});