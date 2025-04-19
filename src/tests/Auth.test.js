import { render, screen } from '@testing-library/react';
import { Auth } from '../components/auth';
//afterEach(() => {
 // jest.clearAllTimers();
  //jest.useRealTimers();
//});clear cache


test('renders Web app name text',()=>{
  render(<Auth/>);
  const nameText = screen.getByText(/Crafts & Grain/i);
  expect(nameText).toBeInTheDocument();
});
