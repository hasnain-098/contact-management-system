module.exports = {
  testEnvironment: 'jsdom',
  
  moduleFileExtensions: ['js', 'jsx'],
  
  roots: ['<rootDir>'], 

  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  setupFilesAfterEnv: ['<rootDir>/setupTests.cjs'],

  testMatch: ['<rootDir>/tests/**/*.test.{js,jsx}'],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/utils/Validation.jsx',
    '!src/utils/Icons.jsx',
    '!tests/**/*.{js,jsx}'
  ],
  coverageDirectory: 'coverage',
  
  testPathIgnorePatterns: ['/node_modules/'],
};