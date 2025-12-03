/**
 * Backend Test Setup
 * Global test configuration and utilities
 */

// Suppress console output during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging test issues
  error: console.error
};

// Mock timers for testing
beforeEach(() => {
  jest.clearAllMocks();
});

// Helper to wait for events
global.waitForEvent = (emitter, event, timeout = 1000) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    emitter.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
};

// Helper to create test alert data
global.createTestAlertData = (overrides = {}) => {
  return {
    type: 'leak_detected',
    severity: 'warning',
    location: 'test_location',
    description: 'Test alert',
    value: 10,
    threshold: 5,
    confidence: 0.8,
    timestamp: new Date().toISOString(),
    ...overrides
  };
};

// Global test configuration
jest.setTimeout(10000);
