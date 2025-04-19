import { render, screen } from '@testing-library/react';
import { Auth } from './Auth';

test('renders Web app name text',()=>{
  render(<Auth/>);
  const nameText = screen.getByText(/Crafts & Grain/i);
  expect(nameText).toBeInTheDocument();
});

test('renders a button with text "Sign in with Google"',()=> {
    render(<Auth/>);
    const button = screen.getByText(/Sign in with Google/i);
    expect(button).toBeInTheDocument();
  });

// Fakes a sign up so that the pop-up can be tested for functionality
  jest.mock('firebase/auth', () => ({
    signInWithPopup: jest.fn(),
  }));
  
  test('signInWithPopup appears upon clicking Sign In button', async()=>
    {render(<Auth />);
    const button = screen.getByText(/Sign in with Google/i);
    fireEvent.click(button);
  
    expect(signInWithPopup).toHaveBeenCalled();
  });