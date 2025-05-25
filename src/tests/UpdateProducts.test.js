import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Updateproduct } from "../components/updateproducts";
import * as firebaseFunctions from "firebase/functions";

// Mock the needed dependancies
const mockNavigate = jest.fn();

jest.mock('../config/firebase', () => {
  return {
    functions: {}, 
  };
});

// Clear our mock navigation before each test to avoid test pollution
beforeEach(() => {
  mockNavigate.mockClear();
});

// Mock the Firebase httpsCallable function to return a successful promise
// This lets us test without actually calling Firebase
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { message: 'Mock success!' } }))),
}));

describe("Updateproduct", () => {
  // Before each test in this block:
  beforeEach(() => {
    // Clear all mocks to ensure clean test state
    jest.clearAllMocks();
    
    // Set up mock localStorage values that our component expects
    window.localStorage.setItem("shopid", "123");
    window.localStorage.setItem("productupdateid", "456");

    // Mock the useNavigate hook from react-router
    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => mockNavigate,
    }));
  });

  // Test that all form fields and buttons render correctly
  it("renders all input fields and buttons", () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Check that all expected form fields are present
    expect(screen.getByLabelText(/name of product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description of the product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByTestId('image-input')).toBeInTheDocument();
    expect(screen.getByText(/← back/i)).toBeInTheDocument();
  });

  // Test the product name update functionality
  it("submits name form and navigates", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Simulate typing in the product name field
    fireEvent.change(screen.getByLabelText(/name of product/i), {
      target: { value: "New Product Name" },
    });

    // Click the update button
    fireEvent.click(screen.getByText(/update product name/i));

    // Verify that Firebase was called and navigation occurred
    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/displayproducts");
    });
  });

  // Test the description update functionality
  it("submits description form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Simulate typing a description
    fireEvent.change(screen.getByLabelText(/description of the product/i), {
      target: { value: "A test description" },
    });

    // Click the update button
    fireEvent.click(screen.getByText(/update description/i));

    // Verify Firebase was called
    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  // Test the price update functionality
  it("submits price form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Simulate typing a price
    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: "99" },
    });

    // Click the update button
    fireEvent.click(screen.getByText(/update price/i));

    // Verify Firebase was called
    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  // Test the quantity update functionality
  it("submits quantity form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Simulate typing a quantity
    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: "20" },
    });

    // Click the update button
    fireEvent.click(screen.getByText(/update quantity/i));

    // Verify Firebase was called
    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  // Test the image upload functionality
  it("uploads image", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    // Create a dummy file for testing
    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId('image-input');
    
    // Mock the file input
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    // Simulate file selection and button click
    fireEvent.change(input);
    fireEvent.click(screen.getByText(/update image/i));

    // Verify Firebase was called
    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });
});