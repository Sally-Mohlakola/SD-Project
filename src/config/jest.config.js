// jest.config.js
module.exports = {
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['js', 'jsx'],
    transform: {},
  
    moduleNameMapper: {
      '^src/(.*)$': '<rootDir>/src/$1',
      '^react-router-dom$': require.resolve('react-router-dom'), // 👈 Add this line to fix the error
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',           // 👈 Optional: prevents CSS import errors
    },
  };
  