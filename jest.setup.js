// jest.setup.js
jest.mock('firebase/app', () => require('./__mocks__/firebase'));
jest.mock('firebase/auth', () => require('./__mocks__/firebase'));
jest.mock('firebase/firestore', () => require('./__mocks__/firebase'));
jest.mock('firebase/storage', () => require('./__mocks__/firebase'));
jest.mock('firebase/functions', () => require('./__mocks__/firebase'));

// In setupTests.js
jest.mock('./src/config/firebase.js', () => ({
  db: {},
  auth: {},
  provider: {},
  storage: {}
}));
