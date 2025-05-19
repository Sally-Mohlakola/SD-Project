// MyShop.test.jsx
import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MyShop } from "../components/myshop";
import { BrowserRouter } from "react-router-dom";

jest.mock("../config/firebase", () => ({
  auth: {
    currentUser: { uid: "mock-user-id", email: "test@example.com" },
  },
  provider: {}, // mock as needed
  db: {},
  storage: {},
}));

// Mocks
jest.mock("firebase/functions", () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(),
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn(),
  deleteObject: jest.fn(),
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  deleteDoc: jest.fn(),
  doc: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

// Mock localStorage
beforeAll(() => {
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn(() => "user-123"), // mock userid
    },
    writable: true,
  });
});

// Setup Firebase mocks
const mockHttpsCallable = jest.fn();
const fakeShops = [
  { id: "1", userid: "user-123", status: "Rejected", imageurl: "img.jpg" },
  { id: "2", userid: "user-456", status: "Accepted" },
];

import { getFunctions, httpsCallable } from "firebase/functions";
getFunctions.mockReturnValue({});
httpsCallable.mockImplementation(() => mockHttpsCallable);

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("MyShop Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state initially", async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [] } });
    renderWithRouter(<MyShop />);
    expect(screen.queryByText("You dont have a shop yet")).not.toBeInTheDocument();
  });

  it("shows 'no shop' UI when user has no shop", async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [] } });
    renderWithRouter(<MyShop />);
    await waitFor(() => {
      expect(screen.getByText("You don't have a shop yet")).toBeInTheDocument();
      
    });
  });

  it("shows rejection UI if shop is rejected", async () => {
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [fakeShops[0]] } });
    renderWithRouter(<MyShop />);
    await waitFor(() => {
      expect(
        screen.getByText(/Your request to open a store was rejected/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Apply to open shop again/i })
      ).toBeInTheDocument();
    });
  });

  it("shows awaiting UI if shop is awaiting", async () => {
    const awaitingShop = { ...fakeShops[0], status: "Awaiting" };
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [awaitingShop] } });
    renderWithRouter(<MyShop />);
    await waitFor(() => {
      expect(
        screen.getByText("The admin has not cleared your store yet!")
      ).toBeInTheDocument();
    });
  });

  it("redirects to dashboard if shop is accepted", async () => {
    const navigateMock = jest.fn();
    jest.spyOn(require("react-router-dom"), "useNavigate").mockReturnValue(navigateMock);

    const acceptedShop = { ...fakeShops[0], status: "Accepted" };
    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [acceptedShop] } });

    renderWithRouter(<MyShop />);
    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/shopdashboard");
    });
  });

  it("calls deleteShop when rejected user reapplies", async () => {
    const deleteMock = jest.fn().mockResolvedValue({ data: { message: "Deleted" } });
    httpsCallable.mockImplementationOnce(() => mockHttpsCallable) // getAllShops
                  .mockImplementationOnce(() => deleteMock);      // deleteShop

    mockHttpsCallable.mockResolvedValueOnce({ data: { shops: [fakeShops[0]] } });

    renderWithRouter(<MyShop />);
    await waitFor(() => {
      expect(screen.getByText(/Your request to open a store was rejected/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Apply to open shop again/i }));

    await waitFor(() => {
      expect(deleteMock).toHaveBeenCalledWith({
        shopId: "1",
        userId: "user-123",
        url: "img.jpg",
      });
    });
  });
});
