/**
 * Frontend Test Setup
 * Global test configuration for React components
 */

import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};
global.sessionStorage = sessionStorageMock;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Suppress console during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only suppress React-specific warnings
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalConsoleError.call(console, ...args);
  });
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Setup default test timeout
jest.setTimeout(10000);

// Helper to wait for async updates
global.waitFor = (fn, options = {}) => {
  const timeout = options.timeout || 1000;
  const interval = options.interval || 50;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const check = () => {
      try {
        fn();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          reject(error);
        } else {
          setTimeout(check, interval);
        }
      }
    };
    check();
  });
};
