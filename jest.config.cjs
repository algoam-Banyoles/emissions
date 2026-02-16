/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.jest.test.ts', '**/*.jest.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|sass|scss)$': '<rootDir>/tests/jest/styleMock.js'
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json'
      }
    ]
  },
  setupFilesAfterEnv: ['<rootDir>/tests/jest/setupTests.cjs'],
  collectCoverageFrom: [
    'src/utils/locale.ts',
    'src/components/forms/EtiquetaEmissions.tsx',
    'src/components/layout/SelectorIdioma.tsx'
  ],
  coverageDirectory: '<rootDir>/coverage/frontend',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};
