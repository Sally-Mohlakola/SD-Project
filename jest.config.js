module.exports = {
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
  },

  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  transformIgnorePatterns: ['node_modules/(?!react-router-dom)'],

  setupFiles: ['whatwg-fetch'],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'], 
  
// Jest configuration
  "jest": {
    "setupFilesAfterEnv": ["./jest.setup.js"],
    "moduleNameMapper": {
      "^firebase/app$": "<rootDir>/__mocks__/firebase.js",
      "^firebase/auth$": "<rootDir>/__mocks__/firebase-auth.js",
      "^firebase/firestore$": "<rootDir>/__mocks__/firebase-firestore.js",
      "^firebase/storage$": "<rootDir>/__mocks__/firebase-storage.js",
      "^firebase/functions$": "<rootDir>/__mocks__/firebase-functions.js"
    }
  }

};
