import React from 'react';
import { Createshop} from '../components/createshop';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { getDocs,addDoc } from 'firebase/firestore';


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
...jest.requireActual('react-router-dom'),
useNavigate: () => mockNavigate,
}));

jest.mock("firebase/firestore", () => ({
    getFirestore: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
  }));
  beforeEach(() => {
    localStorage.setItem('userid', 'u123');
    window.alert = jest.fn();
    });
    
afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    });
describe ('CreateShop component acceptance tests',()=>{
    test('displays alert when atleast one  field are empty on submit', async () => {
        getDocs.mockResolvedValueOnce({ docs: [] });
        render(
            <MemoryRouter>
              <Createshop />
            </MemoryRouter>
          );

    const submitButton = screen.getByText(/Submit to admin/i);

    // CASE: Missing shop name
    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), { target: { files: ['image.jpg'] } });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
    });
    
    // CASE 2: Missing description
    window.alert.mockClear();
    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Ashop' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), { target: { files: ['image.jpg'] } });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
    });

    // CASE 3: Missing category
    window.alert.mockClear();
    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Ashopname' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), { target: { files: ['image.jpg'] } });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
    });

    // CASE 4: Missing image
    window.alert.mockClear();
    fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Ashopname' } });
    fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
    fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
    fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), { target: { files: [] } });

    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please complete all fields before submitting ');
    });
  });

//SUBMIT TO FIREBASE

  describe('Createshop Firebase send test', () => {
    test('sends data to Firebase and displays confirmation paragraph', async () => {
      addDoc.mockResolvedValueOnce({ id: 'mockedDocId123' });
  
      render(
        <MemoryRouter>
          <Createshop />
        </MemoryRouter>
      );
  
     
      window.alert.mockClear();
      fireEvent.change(screen.getByLabelText(/Name of shop/i), { target: { value: 'Ashopname' } });
      fireEvent.change(screen.getByLabelText(/Shop description/i), { target: { value: 'A great shop' } });
      fireEvent.change(screen.getByLabelText(/Category:/i), { target: { value: 'Pottery' } });
      
      const file = new File(['dummy'], 'logo.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText(/Add logo\/image:/i), {target: { files: [file] },});
  
  
      //  Click the submit button
      fireEvent.click(screen.getByText(/Submit to admin/i));
  
      //  Wait for paragraph to show up
      await waitFor(() => {
        expect(screen.getByText(/Your shop has been sent to admin/i)).toBeInTheDocument();
      });
  
      // Check if addDoc was called
      expect(addDoc).toHaveBeenCalledTimes(1);
    });
  });


});