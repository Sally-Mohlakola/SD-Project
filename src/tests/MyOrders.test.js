import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyOrders } from '../components/myorders';
import { MemoryRouter } from 'react-router-dom';
import { getDocs, updateDoc, collection, doc } from 'firebase/firestore';

jest.mock("firebase/firestore", () => {
    return {
    getFirestore: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    };
});


beforeEach(() => {
    localStorage.setItem('userid', 'user123');
    localStorage.setItem('shopname', 'Test Shop');
});

afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
});

const mockOrdersData = [
    {
        id: 'order1',
        data: () => ({
            nameofshop: 'Test Shop',
            address: '123 Main St',
            status: 'Ordered',
        }),
        ref: { id: 'order1' },
    },
];

const mockProductsData = [
    {
        data: () => ({
            name: 'Pottery Vase',
            quantity: 2,
            price: 30,
        }),
    },
];

const mockShopData = [
    {
        id: 'shop123',
        data: () => ({
            userid: 'user123',
        }),
    },
];

const mockShopProducts = [
    {
        data: () => ({
            id: 'prod1',
            name: 'Pottery Vase',
            price: 30,
            sold: 15,
        }),
    },
];

test('renders MyOrders and displays order data', async () => {
    getDocs.mockImplementation((ref) => {
        const refPath = ref._path?.segments || [];
        if (refPath.includes('Orders')) return Promise.resolve({ docs: mockOrdersData });
        if (refPath.includes('Products')) return Promise.resolve({ docs: mockProductsData });
        if (refPath.includes('Shops') && refPath.length === 1) return Promise.resolve({ docs: mockShopData });
        if (refPath.includes('Shops') && refPath.length === 3) return Promise.resolve({ docs: mockShopProducts });
        return Promise.resolve({ docs: [] });
    });

    render(
        <MemoryRouter>
        <MyOrders />
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText(/My Orders/i)).toBeInTheDocument();
        expect(screen.getByText(/Pottery Vase/i)).toBeInTheDocument();
        expect(screen.getByText(/Status: Ordered/i)).toBeInTheDocument();
    });
});

test('user can update order status', async () => {
    getDocs.mockImplementation((ref) => {
        const refPath = ref._path?.segments || [];
        if (refPath.includes('Orders')) return Promise.resolve({ docs: mockOrdersData });
        if (refPath.includes('Products')) return Promise.resolve({ docs: mockProductsData });
        if (refPath.includes('Shops') && refPath.length === 1) return Promise.resolve({ docs: mockShopData });
        if (refPath.includes('Shops') && refPath.length === 3) return Promise.resolve({ docs: mockShopProducts });
        return Promise.resolve({ docs: [] });
    });

    render(
        <MemoryRouter>
        <MyOrders />
        </MemoryRouter>
    );

    const updateButtons = await screen.findAllByText(/Update status/i);
    fireEvent.click(updateButtons[0]);

    fireEvent.change(screen.getByRole('combobox'), {
        target: { value: 'Dispatched' },
    });

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
        expect(updateDoc).toHaveBeenCalled();
    });
});

test('renders download button for CSV file', async () => {
    getDocs.mockImplementation((ref) => {
        const refPath = ref._path?.segments || [];
        if (refPath.includes('Orders')) return Promise.resolve({ docs: mockOrdersData });
        if (refPath.includes('Products')) return Promise.resolve({ docs: mockProductsData });
        if (refPath.includes('Shops') && refPath.length === 1) return Promise.resolve({ docs: mockShopData });
        if (refPath.includes('Shops') && refPath.length === 3) return Promise.resolve({ docs: mockShopProducts });
        return Promise.resolve({ docs: [] });
    });

    render(
        <MemoryRouter>
        <MyOrders />
        </MemoryRouter>
    );

    await waitFor(() => {
        expect(screen.getByText(/Download Trend Report/i)).toBeInTheDocument();
    });
});
