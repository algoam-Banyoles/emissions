/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.jest.test.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json'
      }
    ]
  },
  collectCoverageFrom: [
    'src/services/calculsEconomics.service.ts',
    'src/services/traduccio.service.ts'
  ],
  coverageDirectory: '<rootDir>/coverage/backend-jest',
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
};
