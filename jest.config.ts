/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  isolatedModules: true,
  globals: {
    'testMatch': [
    "<rootDir>/src/**/*.test.ts"
  ]
  }
};
