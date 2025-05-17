// __mocks__/firebase.js
const mockFirebase = {
  initializeApp: jest.fn(() => ({
    // Mock app instance
  })),
  getAuth: jest.fn(() => ({
    // Mock auth methods
  })),
  GoogleAuthProvider: jest.fn(),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    where: jest.fn(),
    query: jest.fn(),
    getDocs: jest.fn(),
    deleteDoc: jest.fn(),
  })),
  getStorage: jest.fn(),
  getFunctions: jest.fn(),
};

module.exports = mockFirebase;