import {renderHook } from '@testing-library/react';
import { useUserId, useShopId } from '../components/userinfo';
import { collection, getDocs, query, where } from 'firebase/firestore';


jest.mock('../config/firebase', () => ({
  db: {}, 
}));


jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('useUserId', () => {
  it('should return userid from localStorage', () => {
    localStorage.setItem('userid', 'test-user-id');
    const { result } = renderHook(() => useUserId());
    expect(result.current).toBe('test-user-id');
  });
});

describe('useShopId', () => {
  it('should fetch shopid using userid', async () => {
    localStorage.setItem('userid', 'test-user-id');

    const mockDoc = { id: 'shop123', data: () => ({}) };
    getDocs.mockResolvedValue({
      forEach: (cb) => cb(mockDoc),
    });

    const { result } = renderHook(() => useShopId());
    await new Promise((r) => setTimeout(r, 100)); 

    expect(getDocs).toHaveBeenCalled();
    expect(localStorage.getItem('shopid')).toBe('shop123');
  });
});
