import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Updateproduct } from "../components/updateproducts";
import * as firebaseFunctions from "firebase/functions";

const mockNavigate = jest.fn();

// __mocks__/firebase.js (or directly in your test file)
jest.mock('../config/firebase', () => {
  return {
    functions: {}, // mock what you need, e.g., functions object
  };
});
beforeEach(() => {
  mockNavigate.mockClear();
});

// Mock httpsCallable to always return a resolved promise
jest.mock('firebase/functions', () => ({
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: { message: 'Mock success!' } }))),
}));

describe("Updateproduct", () => {
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.localStorage.setItem("shopid", "123");
    window.localStorage.setItem("productupdateid", "456");

    jest.mock("react-router-dom", () => ({
      ...jest.requireActual("react-router-dom"),
      useNavigate: () => mockNavigate,
    }));
  });

  it("renders all input fields and buttons", () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );


    expect(screen.getByLabelText(/name of product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description of the product/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
    expect(screen.getByTestId('image-input')).toBeInTheDocument();
    expect(screen.getByText(/← back/i)).toBeInTheDocument();
  });

  it("submits name form and navigates", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/name of product/i), {
      target: { value: "New Product Name" },
    });

    fireEvent.click(screen.getByText(/update product name/i));

    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/displayproducts");
      
    });
  });

  it("submits description form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/description of the product/i), {
      target: { value: "A test description" },
    });

    fireEvent.click(screen.getByText(/update description/i));

    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  it("submits price form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: "99" },
    });

    fireEvent.click(screen.getByText(/update price/i));

    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  it("submits quantity form", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/quantity/i), {
      target: { value: "20" },
    });

    fireEvent.click(screen.getByText(/update quantity/i));

    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });

  it("uploads image", async () => {
    render(
      <BrowserRouter>
        <Updateproduct />
      </BrowserRouter>
    );

    const file = new File(["dummy"], "test.png", { type: "image/png" });
    const input = screen.getByTestId('image-input');
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);
    fireEvent.click(screen.getByText(/update image/i));

    await waitFor(() => {
      expect(firebaseFunctions.httpsCallable).toHaveBeenCalled();
    });
  });
});
