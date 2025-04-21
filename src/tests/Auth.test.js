import { BrowserRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Auth } from '../components/auth';
//afterEach(() => {
 // jest.clearAllTimers();
  //jest.useRealTimers();
//});clear cache


test('rendering Web app name', () => {
  render(
    <BrowserRouter><Auth /></BrowserRouter>
  );
  
  const appName = screen.getByText(/Crafts & Grain/i);
  expect(appName).toBeInTheDocument();
});



