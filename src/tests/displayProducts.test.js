import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {Displayproducts} from '../components/displayproducts';
import {getDocs} from 'firebase/firestore';
import {useNavigate} from 'react-router-dom';

/*It is important to mock our resources rather than actually writing to the database
mock navigation by fireEvents*/

jest.mock('firebase/firestore', () => ({
    getFirestore: jest.fn(),
    getDocs: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
}));

// Mock the DOM for page navigations
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: jest.fn(),
}));

describe('testing Displayproducts Component ...', () => {
    const navigate = jest.fn();
    const testProduct = [{
    imagelink: 'https://thisisamock.com/picture.img',
    nameofproduct: 'Mock product 1',
    description: 'This is a description',
    price: 10,
    quantity: 10,
  }];

  /* Clear all cache so that there is no memory leak
  to the following test (we want these tests to run independantly)*/
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    useNavigate.mockReturnValue(navigate);
    getDocs.mockResolvedValue({
    forEach: (callback) => testProduct.forEach((product) => {
    callback({ data: () => product,id: '012'});
    })
}); 
});

it('displays the product data', async () => {
    localStorage.setItem('shopid', 'shop012');
    render(<Displayproducts/>);
    
    await waitFor(() => {
        expect(screen.getByText(/Name: Mock product 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Description: This is a description/i)).toBeInTheDocument();
        expect(screen.getByText(/Price:10/i)).toBeInTheDocument();
        expect(screen.getByText(/Quantity:10/i)).toBeInTheDocument();
        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://thisisamock.com/picture.img');
    });
  });
  
it('displays the page banner My Products (text)', async () => {
localStorage.setItem('shopid', 's012');
render(<Displayproducts/>);
expect(await screen.findByText(/My Products/i)).toBeInTheDocument();
});

 
// tests if we can return to the dashboard from this page
it('navigation to /dashboard from displayProducts', async () => {
localStorage.setItem('shopid', 'shop012');
render(<Displayproducts/>);
fireEvent.click(screen.getByText(/← Dashboard/i));
expect(navigate).toHaveBeenCalledWith('/shopdashboard');
});

it('clicking the Add product button', async () => {
localStorage.setItem('shopid', 'shop012');
render(<Displayproducts/>);
fireEvent.click(screen.getByText(/Add product/i));
expect(navigate).toHaveBeenCalledWith('/addproducts');
});

it('clicking the Update product button', async () => {
localStorage.setItem('shopid', 'shop012');
render(<Displayproducts/>);
    
await waitFor(()=> 
    {fireEvent.click(screen.getByText(/Update Product/i));
    expect(localStorage.getItem('item')).toBe('This is the new product name');});
});

  it('clicking the Remove product button', async () => {
    localStorage.setItem('shopid', 'test123');
    render(<Displayproducts />);
    
    await waitFor(() => {
      fireEvent.click(screen.getByText(/Remove Product/i));
    });
  });

  // if the shop id is not available then getDocs since there are no records to be called 
it('shows no products if the shopid is not available', async () => {
    render(<Displayproducts/>);
    expect(getDocs).not.toHaveBeenCalled();
});

//Might remove later, for console logging our records (testing purposes)
it('logs product details during rendering', async () => {
    localStorage.setItem('shopid', 'shop0123');
    const monitorMyConsole = jest.spyOn(console, 'log');
    render(<Displayproducts/>);
    
await waitFor(() => {
    expect(monitorMyConsole).toHaveBeenCalledWith('Url is up there');
    expect(monitorMyConsole).toHaveBeenCalledWith('https://mockimage.com/image.img');
});
    
    monitorMyConsole.mockRestore();

  });
});